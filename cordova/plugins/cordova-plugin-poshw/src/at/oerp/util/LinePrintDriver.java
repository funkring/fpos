package at.oerp.util;

import java.io.IOException;

public interface LinePrintDriver {
	
	// Font
	public final static int FONT_DEFAULT = 0;
	public final static int FONT_LARGE = 1;
	public final static int FONT_SMALL = 2; 
	
	// Style
	public final static int STYLE_BOLD = 1 << 0;
	
	/**
	 * print text
	 * @param inText
	 */
	void printText(String inText) throws IOException;
	
	/**
	 * print line feed
	 * @throws IOException
	 */
	void lf() throws IOException;
	
	/**
	 * set style
	 * @throws IOException
	 */
	void setStyle(int inStyle) throws IOException;
	
	/**
	 * reset 
	 * @throws IOException
	 */
	void reset() throws IOException;
	
	/**
	 * Default font ist {@link #FONT_DEFAULT}
 	 * @param inFont {@link #FONT_LARGE}, {@link #FONT_DEFAULT}, {@link #FONT_SMALL}
	 * @throws IOException
	 */
	void setFont(int inFont) throws IOException;
	
	/**
	 * @return with in millimeter
	 * @throws IOException
	 */
	double getWidth_mm() throws IOException;
	
	/**
	 * @param char with in millimeter
	 * @return
	 */
	double getCharWidth_mm(int inFont, int inStyle);
}
