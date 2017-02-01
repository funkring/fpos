package at.oerp.smartcard;

import java.io.ByteArrayInputStream;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.List;


/**
 * Created by chinnow on 03.05.2016.
 */
public class SmartCardUtil {

	public static String byteToHex(byte[] data) {
		final StringBuilder builder = new StringBuilder(8);
		for (byte b : data) {
			builder.append(String.format("%02x", b));
		}
		return builder.toString();
	}
	
	public static int hexCharToInt(char inChar) {
		if ( Character.isDigit(inChar) ) {
			return inChar-'0';
		} 
		return inChar-'a'+10;
	}
	
	public static byte[] hexToByte(String inData) {
		if ( inData == null ) return new byte[0];
		inData = inData.toLowerCase();
		byte[] res = new byte[inData.length()/2];
		int bIndex = 0;
		for ( int i=0; i<inData.length(); i+=2) {
			int b = hexCharToInt(inData.charAt(i)) << 4 | hexCharToInt(inData.charAt(i+1));
			res[bIndex++] = (byte) b;
		}
		return res;
	}
	
	public static String byteArrayToHexString(byte[] data) {		
		return byteToHex(data).toUpperCase();
	}
	
	public static int byteToUnsignedInt(byte b) {
		int i = b;
		if (i < 0) {
			i += 256;
		}
		return i;
	}
	
	public static X509Certificate buildX509Certificate(List<byte[]> dataList) throws SmartCardException {

		int size = (dataList.size() - 1) * 256;
		size += dataList.get(dataList.size() - 1).length;
		byte[] cert = new byte[size];
		int i = 0;
		for (byte[] b : dataList) {
			System.arraycopy(b, 0, cert, i, b.length);
			i += b.length;
		}
		
		try {
			return  (X509Certificate) CertificateFactory.getInstance("X509").generateCertificate(new ByteArrayInputStream(cert));
		} catch (CertificateException e) {
			throw new SmartCardException(e);
		}
	}

	public static byte[] getFormat1PIN(String pin) throws SmartCardException {
		if (pin.length() != 6 && pin.length() != 4) {
			throw new SmartCardException("Wrong PIN length");
		}
		char[] ca = pin.toCharArray();
		byte[] ba = new byte[8];
		for (int i = 0; i < 8; i++) {
			if (i < ca.length) {
				ba[i] = (byte) ca[i];
			} else {
				ba[i] = 0x00;
			}
		}
		return ba;
	}

	/**
	 * Format 2 PIN block The format 2 PIN block is constructed thus: 1 nibble
	 * with the value of 2, which identifies this as a format 2 block 1 nibble
	 * encoding the length N of the PIN N nibbles, each encoding one PIN digit
	 * 14-N nibbles, each holding the "fill" value 15
	 */
	public static byte[] getFormat2PIN(String pin) throws SmartCardException {

		if (pin.length() != 6 && pin.length() != 4) {
			throw new SmartCardException("Wrong PIN length");
		}
		byte[] ba = new byte[8];
		ba[0] = (byte) ((2 << 4) | pin.length());
		char[] ca = pin.toCharArray();
		ba[1] = (byte) (((ca[0] - 0x30) << 4) | (ca[1] - 0x30));
		ba[2] = (byte) (((ca[2] - 0x30) << 4) | (ca[3] - 0x30));
		if (pin.length() == 6) {
			ba[3] = (byte) (((ca[4] - 0x30) << 4) | (ca[5] - 0x30));
		} else {
			ba[3] = (byte) 0xFF;
		}
		ba[4] = (byte) 0xFF;
		ba[5] = (byte) 0xFF;
		ba[6] = (byte) 0xFF;
		ba[7] = (byte) 0xFF;
		return ba;
	}
	
}
