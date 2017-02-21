package at.oerp.util;

/**
 * Monochrome or black and white image
 * @author oerp
 *
 */
public interface PrinterImage {
		
	public int getWidth();
	
	public int getHeight();
	
	public boolean isBlack(int x, int y);
}
