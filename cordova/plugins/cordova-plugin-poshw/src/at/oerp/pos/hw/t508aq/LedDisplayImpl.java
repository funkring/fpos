package at.oerp.pos.hw.t508aq;

import java.io.IOException;

import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwRS232;

public class LedDisplayImpl extends PosHwDisplay implements CtrlBytes {

	//protected final static byte[] ESC_INIT = new byte[] { ESC, '@' };
	protected final static byte[] ESC_Q_A  = new byte[] { ESC, 'Q', 'A' };
	protected PosHwRS232 serial;
	
	public LedDisplayImpl(PosHwRS232 inSerial) throws IOException {
		serial = inSerial;
		serial.open(9600);
	}
	
	@Override
	public int getCharsPerLine() {
		return 10;
	}

	@Override
	public int getLines() {
		return 1;
	}

	@Override
	public synchronized boolean setDisplay(String... inLines) throws IOException {
		if ( serial != null ) {
			String line = getFirstLine(inLines);
			serial.write(ESC_Q_A);
			serial.write(line);
			serial.write(NULL);
			return true;
		} 
		return false;
	}

	@Override
	public synchronized void close() {
		if ( serial != null ) {
			serial.close();
			serial = null;
		}
	}

}
