package at.oerp.pos.hw.st808;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import android_serialport_api.SerialPort;
import at.oerp.pos.PosHwRS232;

/**
 * Serial Port Implementation
 * @author funkring
 *
 */
public class SerialPortAdapter extends PosHwRS232 {

	SerialPort port;
	File	   file;
	int		   flags;
	
	
	public SerialPortAdapter(File inFile, int inFlags) {		
		file = inFile;
		flags = inFlags;
	}
	
	@Override
	public void open(int inBaud) throws IOException {
		close();
		//port = new SerialPort(file, inBaud, inBits, inParity, inStop, flags);
		port = new SerialPort(file, inBaud, flags, 2);
	}

	@Override
	public InputStream getInputStream() throws IOException {
		return port.getInputStream();
	}

	@Override
	public OutputStream getOutputSream() throws IOException {
		return port.getOutputStream();
	}
	
	@Override
	public void close() {
		if ( port != null ) {
			try {
				port.close();
			} finally {
				port = null;
			}
		}		
	}
	
	public boolean isOpen() {
		return port != null;
	}

}
