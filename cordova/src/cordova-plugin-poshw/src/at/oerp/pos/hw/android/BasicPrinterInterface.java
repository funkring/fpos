package at.oerp.pos.hw.android;

import java.nio.ByteBuffer;

public abstract class BasicPrinterInterface implements PrinterInterface {
	private ByteBuffer buf;  
	
	public byte[] getBuffer(byte[] inData, int inOffset, int inLen)  {
		if ( buf == null ) {
			buf = ByteBuffer.allocate(inLen);
		} else if ( buf.capacity() < inLen ) {
			buf = ByteBuffer.allocate(inLen);
			buf.limit(inLen);
			buf.rewind();
		} else {
			buf.limit(inLen);
			buf.rewind();
		}
		buf.put(inData, inOffset, inLen);
		return buf.array();
	}
}
