package at.oerp.pos;

import java.io.IOException;

public class PosHwScale implements CtrlBytes {
	
	private final static byte[] REC_01 = {'0','1'}; 
	private final static byte[] REC_03 = {'0','3'};
	private final static byte[] REC_08 = {'0','8'};
	private final static byte[] READ_RESULT = { EOT, ENQ };
	
	PosHwRS232 serial;
	char[]	   rec = new char[2];
	
	/**
	 * constructor
	 * @param inSerial
	 * @throws IOException 
	 */
	public PosHwScale(PosHwRS232 inSerial) throws IOException {
		serial = inSerial;
		serial.open(9600);
	}
	
	/**
	 * @return error
	 * @throws IOException
	 */
	protected int readError() throws IOException {
		int errorCode = -1;
		
		serial.clearInput();
		serial.write(EOT);
		serial.write(STX);
		serial.write(REC_08);
		serial.write(ETX);
		serial.flush();
		
		int res = serial.read();
		if ( res == STX ) {
			rec[0] = (char) serial.read();
			rec[1] = (char) serial.read();
			if ( rec[0] == '0' && rec[1] == '9' && serial.read() == ESC ) {
				errorCode = Integer.parseInt(new String(new char[] { (char) serial.read(), (char) serial.read() }));
				// reset error code if it is not ETX at the end
				if ( serial.read() != ETX ) {
					errorCode = -1;
				} 
			} 
		}
		
		if ( errorCode == -1) {
			throw new IOException("invalid error");
		}
		
		return errorCode;
	}
	
	/**
	 * init weighing
	 * @param inPrice price
	 * @param inTara tara
	 * @return true if successful
	 * @throws IOException 
	 */
	public synchronized boolean init(float inPrice, float inTara ) throws IOException {
		//serial.write(new byte[] { EOT, STX, '0', '1', ESC, '0', '0', '0', '0', '0', '1', ESC, ETX});
		serial.clearInput();
		serial.write(EOT);
		serial.write(STX);
		serial.write(REC_03);
		serial.write(ESC);
		serial.writeDigits(inPrice,5,2);
		serial.write(ESC);
		serial.writeDigits(inTara,4,3);
		serial.write(ETX);
		serial.flush();
		
		/*
		serial.write(EOT);
		serial.write(STX);
		serial.write(REC_01);
		serial.write(ESC);
		serial.writeDigits(inPrice,5,2);
		serial.write(ETX);
		serial.flush();*/
		
		// read
		int res = serial.read();
		if ( res == ACK ) 
			return true;
		
		// read error
		if ( res == NAK ) {
			int error = readError();
			if ( error == 0 || error == 21 )
				return true;
			if ( error > 0 )
				return false;
		}
		
		//if ( res == 11 ) {
			//checksum handling
		//}			
		throw new IOException("invalid init result");
	}
	
	/**
	 * read result
	 * @param ioResult
	 * @return
	 * @throws IOException
	 */
	public synchronized boolean readResult(WeightResult ioResult) throws IOException {
		do {
			serial.clearInput();
			serial.write(READ_RESULT);
			serial.flush();
			int res = serial.read();
			if ( res == STX ) {
				if ( serial.read() == '0' && serial.read() == '2' && serial.read() == ESC ) {
					res = serial.read();
					// read unit
					switch ( res ) {
					case 0x30:
						ioResult.unit="lb : oz / 1/8 oz";
						break;
					case 0x31:
						ioResult.unit="lb / 0,01";
						break;
					case 0x32:
						ioResult.unit="lb / 0,005";
						break;
					case 0x33:
						ioResult.unit="kg";
						break;
					default:
						return false;
					}
					
					// read weight
					if ( serial.read() == ESC ) {
						ioResult.weight = serial.readDigits(5, 3);
						
						// read price
						if ( serial.read() == ESC ) {
							ioResult.price = serial.readDigits(6, 2);
							
							// read 
							if ( serial.read() == ESC ) {
								ioResult.total = serial.readDigits(6, 2);
								
								// finished
								return serial.read() == ETX;
							}
						}
					} 
					
				}
				
				// throw error
				throw new IOException("invalid result");
				
			} else if ( res == NAK ) {
				int error = readError();
				// see dialog06 errors, if weighing as not finished
				// return false
				return false;
			} else {
				throw new IOException("invalid weighing result");
			}
		} while ( true );
	}
	
	public void close() {
	}
	
}
