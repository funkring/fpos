package at.oerp.pos;

import java.io.IOException;

import at.oerp.util.IObjectResolver;

public abstract class PosHwPrinter {
	
	public abstract String getType();
	
	public abstract void printHtml(String inHtml, IObjectResolver inResolver) throws IOException;
	
	public void printHtml(String inHtml) throws IOException {
		printHtml(inHtml, IObjectResolver.EMPTY);
	}
	
	public abstract void printTest() throws IOException;
	
	public abstract void close();
}
