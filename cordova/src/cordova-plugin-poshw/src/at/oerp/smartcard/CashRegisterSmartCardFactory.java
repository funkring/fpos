package at.oerp.smartcard;

import java.io.IOException;

/**
 * Created by chinnow on 03.05.2016.
 */
public class CashRegisterSmartCardFactory {

	public static ICashRegisterSmartCard createInstance(Card card) throws IOException {
		ICashRegisterSmartCard toReturn;
		ATR atr = card.getATR();
		
		// check if atr is supported
		if ( atr != null ) {
			String atrHex = SmartCardUtil.byteArrayToHexString(atr.getBytes());
			if (atrHex.startsWith("3BBF11008131FE45455041")) {
				toReturn = new SmartCardACOS(card);
			} else if (atrHex.startsWith("3BBF11008131FE454D4341")) {
				toReturn = new SmartCardACOS(card);
			} else if (atrHex.startsWith("3BDF18008131FE588031B05202046405C903AC73B7B1D422")) {
				toReturn = new SmartCardCardOS(card);
			} else if (atrHex.startsWith("3BDF18008131FE588031905241016405C903AC73B7B1D444")) {
				toReturn = new SmartCardCardOS(card);
			} else if (atrHex.startsWith("17BF11008131FE45455041")) {
				toReturn = new SmartCardACOS(card);
			} else if ( atrHex.startsWith("17DF18008131FE588031905241016405C903AC73B7B1D444"))  {
				toReturn = new SmartCardCardOS(card);
			} else {
				throw new SmartCardException("Wrong card");
			}
		} else {
			try {
				toReturn = new SmartCardACOS(card);
			} catch ( IOException e) {
				toReturn = new SmartCardCardOS(card);
			}
		}
		return toReturn;
	}
	
	

}
