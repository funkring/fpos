package at.oerp.pos.hw.android;

import java.io.IOException;
import java.nio.ByteBuffer;

import at.oerp.pos.PosHwService;
import at.oerp.util.BinUtil;
import at.oerp.util.PrinterImage;

/**
 * Basic Printer low profile
 * contains a special convertImage function for small buffers
 * 
 * @author oerp
 *
 */
public class BasicPrinterLow extends BasicPrinter {

	public BasicPrinterLow(PosHwService inService, PrinterInterface inIface) {
		super(inService, inIface);
	}

	protected ByteBuffer convertImage(PrinterImage inImage, ByteBuffer inBuf) throws IOException {
		int bmpWidth = inImage.getWidth();
		int bmpHeight = inImage.getHeight();
		
		int blockHeight = 8;
		int blockCount = bmpHeight % blockHeight == 0 ? bmpHeight / blockHeight : (bmpHeight / blockHeight) + 1;
		
		int stride = bmpWidth % 8 == 0 ? bmpWidth / 8 : (bmpWidth / 8);

		// image command
		cmd4[0] = 0x1D;
		cmd4[1] = 0x76;
		cmd4[2] = 0x30;
		cmd4[3] = 0x00;
		
		int fullHeight = blockCount*blockHeight;
		int size = cmd4.length+2+2+(stride*fullHeight)+(blockCount*8)+1;
		
		// init buffer
		if ( inBuf == null || inBuf.capacity() < size) {
			inBuf = ByteBuffer.allocate(size);
		} else {			
			inBuf.rewind();			
		}
		inBuf.limit(size);
		
		
		// build buffer		
		byte[] buf = inBuf.array();
		int b = 0;
		while ( b < fullHeight ) {
			
			//build command		
			inBuf.put(cmd4);
			inBuf.put(BinUtil.getWordLow(stride));
			inBuf.put(BinUtil.getWordHigh(stride));
			inBuf.put(BinUtil.getWordLow(blockHeight));
			inBuf.put(BinUtil.getWordHigh(blockHeight));
			
			// build block
			int y = b;
			b += blockHeight;
			for (; y < b; y++) {
				for (int x = 0; x < bmpWidth; x++) {
					boolean black = y < bmpHeight && x < bmpWidth && inImage.isBlack(x, y);
					BinUtil.setBitReverse(buf, inBuf.position(), x, black);
				}			
				inBuf.position(inBuf.position()+stride);
			}
		}

		inBuf.flip();
		return inBuf;		
	}
}
