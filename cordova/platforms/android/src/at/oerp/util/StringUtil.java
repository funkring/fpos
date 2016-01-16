package at.oerp.util;

public class StringUtil {
	
	/**
	 * format string right
	 * @param inValue value
	 * @param inLen  len of field
	 * @param inChar fill char 
	 * @return right formated string
	 */
	public static String formatRight(String inValue, int inLen, char inChar) {
		StringBuilder b = new StringBuilder(inValue);
		if( b.length() > inLen ) {
			b.delete(0, b.length()-inLen);
		} 		
		while ( b.length() < inLen ) {
			b.insert(0, inChar);
		}
		return b.toString();
	}
	
	
	/**
	 * format string leift
	 * @param inValue value
	 * @param inLen len of field
	 * @param inChar fill char
	 * @return left formated string
	 */
	public static String formatLeft(String inValue, int inLen, char inChar) {
		StringBuilder b = new StringBuilder(inValue);
		if( b.length() > inLen ) {
			b.delete(b.length()-inLen+1, b.length());
		}  		
		while ( b.length() < inLen ) {
			b.append(inChar);
		}
		return b.toString();
	}
	
	
	/**
	 * format fix length digit string 
	 * @param inValue value
	 * @param inLen length of field
	 * @param inDecPlaces decimal places
	 * @return fix formated digits
	 */
	public static String getDigits(float inValue, int inLen, int inDecPlaces) {
		int preDecLen = inLen - inDecPlaces;
		String[] tok = Float.toString(Math.abs(inValue)).split("\\.");
		return formatRight(tok[0], preDecLen, '0') + formatLeft(tok[1], inDecPlaces, '0');
	}
	
	/**
	 * parse float
	 * @param inValue
	 * @param inLen
	 * @param inDecPlaces
	 * @return
	 */
	public static float parseDigits(String inDigits, int inLen, int inDecPlaces) {
		 return Float.parseFloat(inDigits.substring(0, inLen-inDecPlaces) + "." + inDigits.substring(inLen-inDecPlaces, inLen));
	}
}
