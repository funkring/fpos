package at.oerp.pos;

import android.graphics.Bitmap;
import at.oerp.util.PrinterImage;

public final class BitmapImage implements PrinterImage {

	final Bitmap data;
	
	public BitmapImage(Bitmap inData) {
		data = inData;
	}
	
	@Override
	public int getWidth() {
		return data.getWidth();
	}

	@Override
	public int getHeight() {
		return data.getHeight();
	}

	@Override
	public boolean isBlack(int x, int y) {
		int color = data.getPixel(x, y); 
		int r = (color >> 16) & 0xff;
		int g = (color >> 8) & 0xff;
		int b = color & 0xff;

		// check white
		if (r > 160 && g > 160 && b > 160) return false;
		return true;
	}

	@Override
	public Bitmap getBitmap() {
		return data;
	}

}
