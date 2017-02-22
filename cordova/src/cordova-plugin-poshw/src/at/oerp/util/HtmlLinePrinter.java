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

	/**
	 * font styles
	 */
	private final static Pattern STYLE_FONT = Pattern.compile("font-size:\\s*([a-z]+)");   // dw=true, dh=true

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
	private Parser					parser;
	private int						maxLineChars;
	private LinePrintDriver			driver;
	
	private double					textsplitFactor = 0.3;
	private int						minTextSplitChars = 2;
	
	public HtmlLinePrinter(int inMaxLineChars) throws IOException {
		maxLineChars = inMaxLineChars;
	}
	
	public HtmlLinePrinter(LinePrintDriver inDriver) throws IOException {
		maxLineChars = (int) (inDriver.getWidth_mm() / inDriver.getCharWidth_mm(LinePrintDriver.FONT_DEFAULT,0));
		driver = inDriver;
	}
	
	public double getTextsplitFactor() {
		return textsplitFactor;
	}

	public void setTextsplitFactor(double textsplitFactor) {
		this.textsplitFactor = textsplitFactor;
	}

	public int getMinTextSplitChars() {
		return minTextSplitChars;
	}

	public void setMinTextSplitChars(int minTextSplitChars) {
		this.minTextSplitChars = minTextSplitChars;
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
			doc.validateSize(maxLineChars);
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
	 * Fill date into grid
	 * @param inElement
	 * @param inGrid
	 * @param inRow
	 * @param inCol
	 * @return
	 */
	public int fillGrid(Element inElement, Grid inGrid, int inRow, int inCol) {
		int col = inCol;
		for ( ListIterator<Element> it = inElement.childs.listIterator();  it.hasNext(); ) {
			Element child = it.next();
			if ( child instanceof TextElement ) {
				// insert text
				TextElement tElement = (TextElement) child;
				inGrid.setValue(inRow, inCol, tElement.format(), child.style, null);
			} else {
				// create cell
				if ( child.newRow() ) inGrid.setValue(inRow, inCol, "", child.style, child.getPrintWidget());

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
	
	class GridLine {
		public StringBuilder  data = new StringBuilder();
		public int			  style;
		public Element		  printWidget;
		
		public String toString() {
			return data.toString();
		}
		public String toPrintString() {
			return data.toString().replace('\u00a0', ' ');
		}
	}

	class Grid {
		ArrayList<GridLine> lines = new ArrayList<GridLine>();

		void setValue(int inRow, int inCol, String inValue, int inStyle, Element inWidget) {
			// add rows
			if ( inRow >= lines.size() ) {
				for ( int i=lines.size(); i<=inRow; i++) {
					GridLine line = new GridLine();
					line.style = inStyle;
					lines.add(line);
				}
			}

			// add cols
			GridLine line = lines.get(inRow);
			if (inWidget != null) line.printWidget = inWidget;
			
			if ( line.data.length() < inCol) {
				for ( int i=line.data.length(); i<inCol; i++)
					line.data.append(' ');

				line.data.append(inValue);
			} else {
				line.data.replace(inCol, inCol+inValue.length(), inValue);
			}
		}

		public String toString() {
			StringBuilder b = new StringBuilder();
			for ( int i=0; i<lines.size(); i++) {
				if (i>0)
					b.append("\n");
				b.append(lines.get(i).toPrintString());
			}
			return b.toString();
		}

		public void print() throws IOException {
			int style = 0;
			for ( GridLine line : lines ) {				
				if ( line.style != style ) {
					driver.setStyle(line.style);
					style = line.style;
				}
				if ( line.printWidget != null ) {
					line.printWidget.printWidget();
				} else {
					driver.writeln(line.toPrintString());
				}
			}
		}
	}

	/**
	 * Root Element
	 * @author funkring
	 */
	class Element implements ContentHandler {

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
				style = parseStyle(inAttribs, style);
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
				Element lastElement = !childs.isEmpty() ? childs.getFirst() : null;
				if ( lastElement instanceof TextElement ) {
					TextElement lastTextElement = (TextElement) lastElement;
					textBuilder.insert(0, lastTextElement.text);
					lastTextElement.text = textBuilder.toString();
				} else {
					childs.add(new TextElement(textBuilder.toString(), style, align));
				}
				textBuilder.setLength(0);
			}
		}

		@Override
		public void startPrefixMapping(String prefix, String uri) throws SAXException {
		}

		@Override
		public void endPrefixMapping(String prefix) throws SAXException {
		}

		/**
		 * parse the style of passed attributes
		 * @param inAttrs
		 * @param inStyle
		 * @return
		 */
		public int parseStyle(Attributes inAttrs, int inStyle) {
			String style = inAttrs.getValue("style");
			if ( style != null && !style.isEmpty() ) {
				Matcher m = STYLE_FONT.matcher(style);
				if ( m.find() ) {
					String fontStyle = m.group(1);
					if ( "large".equalsIgnoreCase(fontStyle) ) {
						inStyle = LinePrintDriver.STYLE_DOUBLE_H | LinePrintDriver.STYLE_DOUBLE_W | (inStyle & (~LinePrintDriver.STYLE_SMALL));
					} else if ( "medium".equalsIgnoreCase(fontStyle) ) {
						inStyle |= (LinePrintDriver.STYLE_DOUBLE_H | LinePrintDriver.STYLE_DOUBLE_W | LinePrintDriver.STYLE_SMALL);
					} else if ( "small".equalsIgnoreCase(fontStyle) ) {
						inStyle |= LinePrintDriver.STYLE_SMALL;
					} else if ( "larger".equalsIgnoreCase(fontStyle) ) {
						inStyle =  LinePrintDriver.STYLE_DOUBLE_W | (inStyle & (~LinePrintDriver.STYLE_SMALL) & (~LinePrintDriver.STYLE_DOUBLE_H));
					} else if ( "smaller".equalsIgnoreCase(fontStyle) ) {
						inStyle =  LinePrintDriver.STYLE_SMALL | LinePrintDriver.STYLE_DOUBLE_H | (inStyle & (~LinePrintDriver.STYLE_DOUBLE_W));
					} else if ( "initial".equalsIgnoreCase(fontStyle) ) {
						inStyle =  inStyle & ~(LinePrintDriver.STYLE_SMALL | LinePrintDriver.STYLE_DOUBLE_H | LinePrintDriver.STYLE_DOUBLE_W);
					}
				}
			}
			return inStyle;
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
			} else if ( "img".equalsIgnoreCase(inTagName)) {
				String src = inAttrs.getValue("src");							
				if ( "qrcode".equalsIgnoreCase(src) ) {
					parser.setContentHandler(addChild(new QrCodeElement(this, inTagName, inAttrs, style, align)));
				} else {
					try {
						parser.setContentHandler(addChild(new ImageElement(this, inTagName, inAttrs, style, align)));
					} catch ( IOException e ) {
						throw new SAXException(e);
					}
				}
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

		/**
		 * @param inMaxChars
		 * @return chars
		 */
		protected int calcChars(int inMaxChars) {
			int chars = (int) Math.round(((double) inMaxChars*percent));
			return chars > 0 ? chars : 1;
		}

		/**
		 * validate sizes
		 * @param inElement
		 * @param inSizeMM
		 * @throws IOException
		 */
		public void validateSize(int inMaxChars) throws IOException {
			for ( ListIterator<Element> it = childs.listIterator();  it.hasNext(); ) {
				Element child = it.next();

				//calc chars
				child.chars = child.calcChars(inMaxChars);

				if ( child instanceof TextElement ) {
					// split text
					TextElement tElement = (TextElement) child;
					while ( tElement.text.length() > tElement.chars ) {
						int searchCount = (int) Math.round(tElement.chars*textsplitFactor);
						int splitIndex = tElement.chars-1;
						if ( searchCount > minTextSplitChars) {
							for ( int i=tElement.text.length()-1; i>searchCount;i--) {
								if ( tElement.text.charAt(i) == ' ' && i < tElement.chars ) {
									splitIndex = i+1;
									break;
								}
							}
						}
						// split at position
						tElement = tElement.split(splitIndex);
						it.add(new LineBreakElement());
						it.add(tElement);
					}
				} else {
					if ( child.newRow() && child.chars == maxLineChars ){
						double charWidth = driver.getCharWidth_mm(LinePrintDriver.FONT_DEFAULT, child.style);
						int chars = charWidth > 0 ? (int) (driver.getWidth_mm() / charWidth) : 1;
						child.validateSize(chars);
					} else {
						child.validateSize(child.chars);
					}
				}
			}
		}
		
		public Element getPrintWidget() {
			return null;
		}
		
		public void printWidget() throws IOException {
			
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

		/**
		 * correct size for cells
		 */
		public void validateSize(int inMaxChars) throws IOException {
			// call full width
			int width = 0;
			CellElement correctionCell = null;
			int correctionCellChars = 0;

			// iterate childs
			for ( Element child : childs) {
				if ( child instanceof CellElement ) {
					CellElement cell = (CellElement) child;

					// get chars
					width += cell.calcChars(inMaxChars);

					// select cell with most chars
					if ( chars >= correctionCellChars ) {
						correctionCellChars = chars;
						correctionCell = cell;
					}
				}
			}

			//correct with last cell
			if ( correctionCell != null && width != inMaxChars  && inMaxChars > 0) {
				double rest = (1.0 / (double) inMaxChars) * (inMaxChars - width);
				correctionCell.percent += rest;
			}

			// call supermethod
			super.validateSize(inMaxChars);
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
	
	// QrCode
	class QrCodeElement extends Element {
		String code;
		public QrCodeElement(Element inParent, String inEndElement, Attributes inAttribs, int inStyle, int inAlign) {
			super(inParent, inEndElement, inAttribs, inStyle, inAlign);
			code = inAttribs.getValue("alt");	
		}
		@Override
		boolean newRow() {
			return true;
		}
		@Override
		public void printWidget() throws IOException {
			if ( code != null && !code.isEmpty() ) {
				driver.printQRCode(code);
			}
		}
		
		@Override
		public Element getPrintWidget() {
			return this;
		}
	}
	
	// Image
	class ImageElement extends Element {
		String name;
		PrinterImage img;
		public ImageElement(Element inParent, String inEndElement, Attributes inAttribs, int inStyle, int inAlign) throws IOException {
			super(inParent, inEndElement, inAttribs, inStyle, inAlign);
			name = inAttribs.getValue("alt");
			String src = inAttribs.getValue("src");			;
			if ( src == null || src.isEmpty() && name != null) {
				img = driver.getImage(name, null);
			} else {
				String[] token = src.split(",");
				if ( token.length == 2 && token[0].indexOf("base64") >= 0 ) {
					img = driver.getImage(name, token[1]);
				}
			}
		}		
		
		@Override
		public void printWidget() throws IOException {		
			if ( img != null ) {
				driver.printImage(img);
			}
		}
		
		@Override
		public Element getPrintWidget() {
			return this;
		}
	}

}
