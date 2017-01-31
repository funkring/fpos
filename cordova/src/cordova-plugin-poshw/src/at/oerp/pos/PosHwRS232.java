package at.oerp.pos;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;

import at.oerp.util.StringUtil;

public abstract class PosHwRS232 {

	protected ReadConfig readCfg = new ReadConfig(100, 10);
	protected Charset charset = Charset.forName("ASCII");
	
	/**
	 * open serial interface
	 * @param inBAud
	 * @param inBits
	 * @param inEvent
	 * @param inStop
	 * @param inFlags
	 */
	public abstract void open(int inBaud)
			throws IOException; 
	
		
	/**
	 * @return input stream for serial interface
	 * @throws IOException
	 */
	public abstract InputStream 
			getInputStream() throws IOException;
	
	/**
	 * @return output stram for serial interface
	 * @throws IOException
	 */
	public abstract OutputStream
			getOutputSream() throws IOException;
	
	/**
	 * close rs232
	 */
	public abstract void close();
	
	/**
	 * clear input buffer
	 * @throws IOException
	 */
	public void clearInput() throws IOException{
		InputStream in = getInputStream();
		while ( in.available() > 0 ) {
			in.read();
		}
	}
	
	public ReadConfig getReadCfg() {
		return readCfg;
	}


	public void setReadCfg(ReadConfig readCfg) {
		this.readCfg = readCfg;
	}


	/**
	 * write data
	 * @param inData
	 * @throws IOException
	 */
	public void write(byte[] inData) throws IOException {
		getOutputSream().write(inData);
	}
	
	/**
	 * write data
	 * @param inData
	 * @throws IOException
	 */
	public void write(int inByte) throws IOException {
		getOutputSream().write(inByte);
	}
	
	/**
	 * flush
	 * @throws IOException 
	 */
	public void flush() throws IOException {
		getOutputSream().flush();
	}
	
	/**
	 * write data
	 * @param inBytes
	 * @throws IOException
	 */
	public void write(String inData) throws IOException {
		if ( inData.length() > 0 ) {
			getOutputSream().write(inData.getBytes(charset));
		}
	}
	
	/**
	 * write data
	 * @param inBytes
	 * @throws IOException
	 */
	public void writeDigits(float inValue, int inLen, int inDecPlaces) throws IOException {
		String digits = StringUtil.getDigits(inValue, inLen, inDecPlaces);
		write(digits);
	}

	/**
	 * read digits
	 * @param inLen
	 * @param inDecPlaces
	 * @return parsed digits
	 * @throws IOException
	 */
	public float readDigits(int inLen, int inDecPlaces) throws IOException {
		byte[] buf = new byte[inLen];
		if ( read(buf) != buf.length )
			return 0.0f;
				
		String digits = new String(buf, charset);
		return StringUtil.parseDigits(digits, inLen, inDecPlaces);
	}
	
	/**
	 * read data
	 * @throws IOException
	 */
	public int read() throws IOException {
		InputStream in = getInputStream();
		int retry = 0;
		do {
			if ( in.available() > 0)
				return in.read();
			
			try {
				Thread.sleep(readCfg.timeout);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				return -1;
			}
			
			retry++;
		} while ( retry < readCfg.retries );
		return -1;
	}	
	
	/**
	 * Read data
	 * @param inData
	 * @param inTimeout
	 * @param inRetries
	 * @throws IOException 
	 */
	public int read(byte[] inData) throws IOException {
		return read(inData, 0, inData.length);
	}
	
	/**
	 * Read data
	 * @param inData
	 * @param inOffset
	 * @param inLen
	 * @return
	 * @throws IOException
	 */
	public int read(byte[] inData, int inOffset, int inLen) throws IOException {
		if ( inLen == 0)
			return 0;
		
		InputStream in = getInputStream();
		int retry = 0;
		int read = 0;
		do {
			int available = in.available();
			if ( available > 0) {
				int readNext = Math.min(inLen, available);
				readNext=in.read(inData, inOffset, readNext);
				inLen-=readNext;
				read+=readNext;				
			}
			
			if ( inLen <= 0)
				return read;
			
			try {
				Thread.sleep(readCfg.timeout);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				return read;
			}			
			
			retry++;
			
		} while (retry < readCfg.retries);
		
		return read;
	}
}
