package at.oerp.pos;

import java.io.IOException;

/**
 * customer display
 * @author funkring
 *
 */
public abstract class PosHwDisplay {

	public abstract int getCharsPerLine();
	public abstract int getLines();
	
	public abstract boolean setDisplay(String ... inLines)
										throws IOException;
	
	public abstract void close();
	
	public String getFirstLine(String ...inLines) {
		if ( inLines != null && inLines.length > 0 ) {
			String line = inLines[0];
			if ( line.length() > getCharsPerLine() ) {
				return line.substring(0, getCharsPerLine());
			}
			return line;
		}
		return "";
	}	
}
