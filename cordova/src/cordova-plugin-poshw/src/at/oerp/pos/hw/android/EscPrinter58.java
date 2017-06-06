package at.oerp.pos.hw.android;

import at.oerp.pos.PosHwService;

public class EscPrinter58 extends BasicPrinterLow {

	public EscPrinter58(PosHwService inService, PrinterInterface inIface) {
		super(inService, inIface);
	}
	
	public double getQRCodeSizeFactor() {	
		return 0.6;
	}

	
}
