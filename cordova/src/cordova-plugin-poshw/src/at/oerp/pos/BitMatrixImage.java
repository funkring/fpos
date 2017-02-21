package at.oerp.pos;

import com.google.zxing.common.BitMatrix;

import at.oerp.util.PrinterImage;

public final class BitMatrixImage implements PrinterImage {

	final BitMatrix data;
	
	public BitMatrixImage(BitMatrix inData) {
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
		return data.get(x, y);
	}

}
