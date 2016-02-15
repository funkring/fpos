package at.oerp.util;

import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class StringUtil {
	
	private final static Pattern PATTERN_NON_ASCII = Pattern.compile("[^\\p{ASCII}]");
	private final static HashMap<String, String> NON_ASCII_REPLACEMENT;
	
	static {
		NON_ASCII_REPLACEMENT = new HashMap<String, String>();
		NON_ASCII_REPLACEMENT.put("ö", "oe");
		NON_ASCII_REPLACEMENT.put("Ö", "Oe");
		NON_ASCII_REPLACEMENT.put("ä", "ae");
		NON_ASCII_REPLACEMENT.put("Ä", "Ae");
		NON_ASCII_REPLACEMENT.put("ü", "ue");
		NON_ASCII_REPLACEMENT.put("Ü", "Ue");
		NON_ASCII_REPLACEMENT.put("ß", "ss");
		NON_ASCII_REPLACEMENT.put("€", "EUR");
	}
	
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
			b.delete(inLen, b.length());
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
	
	/**
	 * Convert all non ASCII chars to something nice ;-)
	 * @param inStr
	 * @return converted string
	 */
	public static String toAscii(String inStr) {
		StringBuffer b = new StringBuffer(inStr.length());
		Matcher m = PATTERN_NON_ASCII.matcher(inStr);
		while (m.find()) {
			String repl = NON_ASCII_REPLACEMENT.get(m.group());
			if ( repl != null ) {
				m.appendReplacement(b, repl);
			} else {
				m.appendReplacement(b, "?");
			}
		}
		m.appendTail(b);
		return b.toString();
	}
}
