package at.oerp.pos.hw.android;

import at.oerp.pos.PosHwService;

public class EscPrinter80 extends BasicPrinterLow {

	public EscPrinter80(PosHwService inService, PrinterInterface inIface) {
		super(inService, inIface);
		width_mm = 70.0;
		charWidth_mm = 70.0/48.0;
	}
	
	public String getType() {
		return "80mm";
	}
}
