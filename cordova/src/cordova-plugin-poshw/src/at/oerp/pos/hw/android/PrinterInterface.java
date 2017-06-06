package at.oerp.pos.hw.android;

import java.io.IOException;

public interface PrinterInterface {
	
	public void begin() throws IOException;
	
	public void end() throws IOException;
	
	public void open() throws IOException;
	
	public void close();
	
	public boolean isOpen();
	
	public String getName();
	
	public void write(byte[] inData) throws IOException;
	
	public void write(byte[] inData, int inOffset, int inDataLen) throws IOException;
	
	public void write(int inData) throws IOException;
	
	public void flush() throws IOException;
	
	public boolean readSupport();
	
	public int read() throws IOException;
	
	public int getDefaultSleep();
}
