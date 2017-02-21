package at.oerp.util;

import java.io.IOException;

public interface LinePrintDriver {
	
	// Font
	public final static int FONT_DEFAULT = 0;
	public final static int FONT_LARGE = 1;
	public final static int FONT_SMALL = 2; 
	
	// Style
	public final static int STYLE_NONE = 0;
	public final static int STYLE_BOLD = 1 << 0;
	public final static int STYLE_DOUBLE_H  = 1 << 1;
	public final static int STYLE_DOUBLE_W  = 1 << 2;
	public final static int STYLE_UNDERLINE = 1 << 3;
	public final static int STYLE_SMALL     = 1 << 4;

	
	/**
	 * print text
	 * @param inText
	 */
	void writeln(String inText) throws IOException;
	
	/**
	 * print image
	 * @param inImage image data
	 * @throws IOException
	 */
	void printImage(PrinterImage inImage) throws IOException;
	
	/**
	 * print qr code
	 * @param inCode
	 * @throws IOException
	 */
	void printQRCode(String inCode) throws IOException;
	
	/**
	 * @param inName name used for caching, if it is null no caching was done
	 * @param inImage base64 coded image data or null to force load from cache
	 * @return Printer specific image data
	 * @throws NoDataException if image data is null, and data not in cache
	 */
	PrinterImage getImage(String inName, String inImage) throws IOException; 
	
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
	
	/**
	 * @return pixel per mm
	 */
	double getPixel_mm();
}
