package at.oerp.pos.hw.st808;

import java.io.IOException;

import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwDisplay;

public class LedDisplayImpl extends PosHwDisplay implements CtrlBytes {
	protected Printer58mm printer;
	public LedDisplayImpl(Printer58mm inPrinter) throws IOException {
		printer = inPrinter;
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
	public boolean setDisplay(String... inLines) throws IOException  {
		return printer.setDisplay(this, inLines);
	}

	@Override
	public void close() {
	}

}
