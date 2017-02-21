package at.oerp.pos.hw.android;

public class BTPrinter80 extends BTPrinter {

	public BTPrinter80() {
		super();
		width_mm = 70.0;
		charWidth_mm = 70.0/48.0;
	}
	
	public String getType() {
		return "80mm";
	}
}
