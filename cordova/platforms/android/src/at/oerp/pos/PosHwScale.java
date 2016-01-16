package at.oerp.pos;

import java.io.IOException;

public class PosHwScale implements CtrlBytes {
	
	//private final static byte[] REC_01 = {'0','1'}; 
	private final static byte[] REC_03 = {'0','3'};
	private final static byte[] READ_RESULT = { EOT, ENQ };
	
	PosHwRS232 serial;
	
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
				
		int res = serial.read();
		//if ( res == 11 ) {
			//checksum handling
		//}				
		return res == ACK;
	}
	
	/**
	 * read result
	 * @param ioResult
	 * @return
	 * @throws IOException
	 */
	public synchronized boolean readResult(WeightResult ioResult) throws IOException {
		serial.clearInput();
		serial.write(READ_RESULT);
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
		}
		return false;
	}
	
	public void close() {
	}
	
}
