package at.oerp.util;

import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.ListIterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.ccil.cowan.tagsoup.HTMLSchema;
import org.ccil.cowan.tagsoup.Parser;
import org.xml.sax.Attributes;
import org.xml.sax.ContentHandler;
import org.xml.sax.InputSource;
import org.xml.sax.Locator;
import org.xml.sax.SAXException;
import org.xml.sax.SAXNotRecognizedException;
import org.xml.sax.SAXNotSupportedException;

/**
 * Parse html and print it out
 * @author funkring
 *
 */
public class HtmlLinePrinter  {
	
	/**
	 * pattern 
	 */
	private final static Pattern BOLD_PATTERN = Pattern.compile("b|strong");
	private final static Pattern H1_PATTERN = Pattern.compile("h[0-9]"); 
	private final static Pattern NUM_PATTERN = Pattern.compile("[0-9]+");
	
	// align
	private static int ALIGN_LEFT = 0;
	private static int ALIGN_CENTER = 1;
	private static int ALIGN_RIGHT = 2;
	
	/**
     * Lazy initialization holder for HTML parser. This class will 
     * a) be preloaded by the zygote, or b) not loaded until absolutely 
     * necessary. 
     */ 
    private static class HtmlParser { 
        private static final HTMLSchema schema = new HTMLSchema(); 
    } 
	
	
	/**
	 * current print driver
	 */
    private IObjectResolver 		resolver;
	private Parser					parser;
	private int						maxLineChars;
	private LinePrintDriver			driver;
	
	/**
	 * constructor
	 * @param inDriver
	 * @throws IOException
	 */
	public HtmlLinePrinter(int inMaxLineChars, IObjectResolver inResolver) throws IOException {
		resolver = inResolver;
		maxLineChars = inMaxLineChars;
	}
	
	public HtmlLinePrinter(LinePrintDriver inDriver, IObjectResolver inResolver) throws IOException {
		resolver = inResolver;
		maxLineChars = (int) (inDriver.getWidth_mm() / inDriver.getCharWidth_mm(LinePrintDriver.FONT_DEFAULT,0));
		driver = inDriver;
	}
	
	/**
	 * @return parser
	 * @throws IOException
	 */
	protected Parser getParser() throws IOException {
		Parser newParser = new Parser();
		try {
			newParser.setProperty(Parser.schemaProperty, HtmlParser.schema);
		} catch (SAXNotRecognizedException e) {
			throw new IOException(e);
		} catch (SAXNotSupportedException e) {
			throw new IOException(e);
		}
		return newParser;			
	}
	
	protected Grid parseGrid(String inHtml) throws IOException {
		try {
				
			// Parse
			parser = getParser();
			Element doc = new Element(null, null, null, 0, 0);
			parser.setContentHandler(doc);
			parser.parse(new InputSource(new StringReader(inHtml)));
			
			// Validate Size
			validateSize(doc, maxLineChars);
			Grid grid = new Grid();
			fillGrid(doc, grid, 0, 0);
			return grid;			
		} catch (SAXException e) {
			if ( e.getCause() instanceof IOException ) {
				throw (IOException) e.getCause();
			}
			throw new IOException(e);
		}
	}
	
	/**
	 * @param inHtml
	 * @return string
	 * @throws IOException
	 */
	public String getText(String inHtml) throws IOException {
		Grid grid = parseGrid(inHtml);
		return grid.toString();
	}
	
	/**
	 * Print HTML
	 * @param inHtml
	 * @throws IOException 
	 */
	public void print(String inHtml) throws IOException {
		driver.reset();
		Grid grid = parseGrid(inHtml);
		grid.print();
	}

	/**
	 * validate sizes
	 * @param inElement
	 * @param inSizeMM
	 */
	public void validateSize(Element inElement, int inMaxChars) {
		
		for ( ListIterator<Element> it = inElement.childs.listIterator();  it.hasNext(); ) {
			Element child = it.next();
			
			child.chars = (int) Math.round(((double) inMaxChars*child.percent));
			
			if ( child instanceof TextElement ) {
				// split text
				TextElement tElement = (TextElement) child;
				while ( tElement.text.length() > tElement.chars ) {
					tElement = tElement.split(tElement.chars-1);
					it.add(new LineBreakElement());
					it.add(tElement);					
				}
			} else {		
				validateSize(child, child.chars);
			}
		}
	}
	
	public int fillGrid(Element inElement, Grid inGrid, int inRow, int inCol) {
		int col = inCol;
		for ( ListIterator<Element> it = inElement.childs.listIterator();  it.hasNext(); ) {
			Element child = it.next();
			if ( child instanceof TextElement ) {
				// insert text
				TextElement tElement = (TextElement) child;
				inGrid.setValue(inRow, inCol, tElement.format());
			} else {	
				// create cell
				inGrid.setValue(inRow, inCol, "");
				
				// fill childs
				inRow = fillGrid(child, inGrid, inRow, col);
				
				// check new col
				if ( child.newCol() ) {
					col+=child.chars;
				}
				
				// check new row
				if ( child.newRow() ) {
					inRow++;
					col=inCol;
				}
			}
		}
		return inRow;
	}
	
	class Grid {
		ArrayList<StringBuilder> lines = new ArrayList<StringBuilder>();
		
		void setValue(int inRow, int inCol, String inValue) {
			// add rows
			if ( inRow >= lines.size() ) {
				for ( int i=lines.size(); i<=inRow; i++) {
					StringBuilder line = new StringBuilder();
					lines.add(line);
				}
			}
			
			// add cols
			StringBuilder line = lines.get(inRow);
			if ( line.length() < inCol) {
				for ( int i=line.length(); i<inCol; i++) 
					line.append(' ');
				
				line.append(inValue);
			} else {
				line.replace(inCol, inCol+inValue.length(), inValue);
			}
		}
		
		public String toString() {
			StringBuilder b = new StringBuilder();
			for ( int i=0; i<lines.size(); i++) {
				if (i>0) 
					b.append("\n");
				b.append(lines.get(i).toString());
			}
			return b.toString();
		}
		
		
		public void print() throws IOException {
			for ( int i=0; i<lines.size(); i++) {
				driver.writeln(lines.get(i).toString());
			}
		}
	}
		
	/**
	 * Root Element
	 * @author funkring
	 */
	class  Element implements ContentHandler {

		StringBuilder 				textBuilder = new StringBuilder();
		Element 	  				parent = null;
		String	  	  	    		endElement = null;
		LinkedList<Element>			childs = new LinkedList<HtmlLinePrinter.Element>();
		int							style;
		int							chars;		
		int							align = ALIGN_LEFT;
		double						percent = 1.0;
		
		/**
		 * constructor
		 * @param inParent
		 */
		public Element(Element inParent, String inEndElement, Attributes inAttribs, int inStyle, int inAlign) {
			parent = inParent;
			endElement = inEndElement;
			style = inStyle;
			align = inAlign;
			
			if ( inAttribs != null ) {
				String alignStr = inAttribs.getValue("align");
				if ( alignStr != null ) {
					if ( "left".equalsIgnoreCase(alignStr) ) {
						align = ALIGN_LEFT;
					} else if ( "center".equalsIgnoreCase(alignStr) ) {
						align = ALIGN_CENTER;
					} else if ( "right".equalsIgnoreCase(alignStr) ) {
						align = ALIGN_RIGHT;
					}
				}
			}
		}
		
		@Override
		public void setDocumentLocator(Locator locator) {
		}

		@Override
		public void startDocument() throws SAXException {
		}

		@Override
		public void endDocument() throws SAXException {
			flushText();
		}
		
		public void flushText() {
			if ( textBuilder.length() > 0 ) {
				childs.add(new TextElement(textBuilder.toString(), style, align));
				textBuilder.setLength(0);
			}
		}

		@Override
		public void startPrefixMapping(String prefix, String uri) throws SAXException {
		}

		@Override
		public void endPrefixMapping(String prefix) throws SAXException {
		}

		@Override
		public void startElement(String inUri, String inTagName, String inQName, Attributes inAttrs) throws SAXException {
			if ( BOLD_PATTERN.matcher(inTagName).matches() ) {				
				style |= LinePrintDriver.STYLE_BOLD;
			} else if ( H1_PATTERN.matcher(inTagName).matches() ) {
				parser.setContentHandler(addChild(new HeadLineElement(this, inTagName, inAttrs, style, align)));
			} else if ( "table".equalsIgnoreCase(inTagName) ) {
				parser.setContentHandler(addChild(new TableElement(this, inTagName, inAttrs, style, align)));
			} else if ( "p".equalsIgnoreCase(inTagName)) {
				parser.setContentHandler(addChild(new ParagraphElement(this, inTagName, inAttrs, style, align)));
			}
		}
		
		protected Element addChild(Element inElement) {
			childs.add(inElement);
			return inElement;
		}

		@Override
		public void endElement(String inUri, String inTagName, String inQName) throws SAXException {
			if ( endElement != null && endElement.equalsIgnoreCase(inTagName) ) {
				flushText();
				parser.setContentHandler(parent);
			} else if ( BOLD_PATTERN.matcher(inTagName).matches() ) {				
				style = style ^ LinePrintDriver.STYLE_BOLD;
			} else if ( inTagName.equalsIgnoreCase("br") ) {
				addChild(new LineBreakElement());
			} else if ( inTagName.equalsIgnoreCase("hr") ) {
				addChild(new HorizontalLineElement());
			}
		}

		@Override
		public void characters(char[] ch, int start, int length) throws SAXException {
			int whitespaceCount = 0;
			for (int i=start; i<length; i++) {
				char c = ch[i];
				if ( Character.isWhitespace(c) ) {
					if ( whitespaceCount == 0 ) {
						textBuilder.append(' ');
					} 
					whitespaceCount++;
				} else {
					whitespaceCount = 0;
					textBuilder.append(c);
				}
			}
			flushText();
		}
		
		@Override
		public void ignorableWhitespace(char[] ch, int start, int length) throws SAXException {
		}

		@Override
		public void processingInstruction(String target, String data) throws SAXException {
		}

		@Override
		public void skippedEntity(String name) throws SAXException {
		}
		
		/**
		 * print
		 */
		public void print() throws IOException {
			for ( Element e : childs ) {
				e.print();
			}
		}
		
		/**
		 * @return new row should be created
		 */
		boolean newRow() {
			return false;
		}
		
		/**
		 * new col should be created
		 * @return
		 */
		boolean newCol() {
			return false;
		}
	}
	
	// Text Element
	class TextElement extends Element {
		public String text;
		public TextElement(String inText, int inStyle, int inAlign) {
			super(null, null, null, inStyle, inAlign);
			text = inText;
		}
		public TextElement split(int inPos) {			
			String splitText = text.substring(inPos);
			text = text.substring(0, inPos);
			TextElement splitElement = new TextElement(splitText, style, align);
			splitElement.parent = parent;
			splitElement.style = style;
			splitElement.chars = chars;
			splitElement.align = align;
			splitElement.percent = percent;			
			return splitElement;
		}
		public String format() {			
			if ( text.length() != chars ) {
				StringBuilder formated = new StringBuilder();
				int tmpAlign = align;				
				for ( int i=0; i < chars; i++ ) {
					// if center align change 
					// align every loop 
					if ( align == ALIGN_CENTER ) {
						if ( tmpAlign == ALIGN_RIGHT ) {
							tmpAlign = ALIGN_LEFT;
						} else {
							tmpAlign = ALIGN_RIGHT;
						}
					}
					if ( i < text.length() ) {
						formated.append(text.charAt(i));
					} else if ( tmpAlign == ALIGN_LEFT ) {
						formated.append(' ');
					} else if ( tmpAlign == ALIGN_RIGHT ) {
						formated.insert(0,' ');
					} 
				}
				text = formated.toString();
			}
			return text;
		}
	}
	
	// Horizontal Line
	class HorizontalLineElement extends TextElement {
		public HorizontalLineElement() {
			super("", 0, 0);
		}
		@Override
		public String format() {
			if ( text.length() != chars ) {
				StringBuilder formated = new StringBuilder();
				for ( int i=0; i< chars; i++) {
					formated.append('-');
				}
				text = formated.toString();
			}
			return text.toString();
		}
	}
		
	// Table Element
	class TableElement extends Element {
		public TableElement(Element inParent, String inEndElement, Attributes inAttribs, int inStyle, int inAlign) {
			super(inParent, inEndElement, inAttribs, inStyle, inAlign);
		}
		
		@Override
		public void startElement(String inUri, String inTagName, String inQName, Attributes inAttrs)
				throws SAXException {
			if ( "tr".equalsIgnoreCase(inTagName) ) {
				parser.setContentHandler(addChild(new RowElement(this, inTagName, inAttrs, style, align)));
			} else {
				super.startElement(inUri, inTagName, inQName, inAttrs);
			}
		}
	}
	
	// Row Element
	class RowElement extends Element {
		public RowElement(Element inParent, String inEndElement, Attributes inAttribs, int inStyle, int inAlign) {
			super(inParent, inEndElement, inAttribs, inStyle, inAlign);
		}
		
		@Override
		public void startElement(String inUri, String inTagName, String inQName, Attributes inAttrs)
				throws SAXException {
			if ( "td".equalsIgnoreCase(inTagName)) {
				parser.setContentHandler(addChild(new CellElement(this, inTagName, inAttrs, style, align)));
			} else {
				super.startElement(inUri, inTagName, inQName, inAttrs);
			}
		}
		
		@Override
		public void endElement(String uri, String tagName, String qName) throws SAXException {
			super.endElement(uri, tagName, qName);
			
			// cols
			int colNoWidthCount = 0;
			double remainingWidth = 1.0;
			for ( Element child : childs) {
				if ( child instanceof CellElement ) {
					CellElement cell = (CellElement) child;					
					if ( cell.width > 0.0 ) {
						remainingWidth-=cell.width;
						cell.percent = cell.width;
					} else {
						colNoWidthCount+=cell.colspan;
					}
				}
			}
			
			// validate percent
			if ( colNoWidthCount > 0 ) {
				for ( Element child : childs) {
					if ( child instanceof CellElement ) {
						CellElement cell = (CellElement) child;
						// update percent
						if ( cell.width <= 0.0 ) {
							cell.percent = ((double) cell.colspan / (double) colNoWidthCount) * remainingWidth;
						}
					}
				}
			}
		}
		@Override
		boolean newRow() {
			return true;
		}
	}
	
	// Cell Element
	class CellElement extends Element {
		int 	colspan=1;
		double  width=0.0;
		public CellElement(Element inParent, String inEndElement, Attributes inAttribs, int inStyle, int inAlign) {
			super(inParent, inEndElement, inAttribs, inStyle, inAlign);
			if ( inAttribs != null ) {				
				String colspanStr = inAttribs.getValue("colspan");
				if (colspanStr != null ) {
					colspan = Integer.parseInt(colspanStr);
				}
				String widthStr = inAttribs.getValue("width");
				if ( widthStr != null ) {
					Matcher m = NUM_PATTERN.matcher(widthStr);
					if ( m.find() ) {
						width = Integer.parseInt(m.group(0)) / 100.0;
					}
				}
				
			}
		}		
		@Override
		boolean newCol() {
			return true;
		}
	}

	// Headline Element
	class HeadLineElement extends Element {
		public HeadLineElement(Element inParent, String inEndElement, Attributes inAttribs, int inStyle, int inAlign) {
			super(inParent, inEndElement, inAttribs, inStyle, inAlign);
		}
		
		@Override
		public void flushText() {
			textBuilder = new StringBuilder(textBuilder.toString().toUpperCase());
			super.flushText();
		}
		@Override
		boolean newRow() {
			return true;
		}
	}
	
	// New Line
	class LineBreakElement extends Element {
		public LineBreakElement() {
			super(null, null, null, 0, 0);
		}
		@Override
		boolean newRow() {
			return true;
		}
	}
	
	// Paragraph
	class ParagraphElement extends Element {
		public ParagraphElement(Element inParent, String inEndElement, Attributes inAttribs, int inStyle, int inAlign) {
			super(inParent, inEndElement, inAttribs, inStyle, inAlign);
		}
		@Override
		boolean newRow() {
			return true;
		}
	}
	
}
