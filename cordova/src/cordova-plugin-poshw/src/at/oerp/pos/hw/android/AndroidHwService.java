package at.oerp.pos.hw.android;

import java.io.IOException;

import android.app.Application;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwRS232;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.PosHwService;

public class AndroidHwService extends PosHwService {

	BasicPrinter printer;
	boolean   printerFail;
	
	public AndroidHwService(Application app) {
		super(app);
	}

	@Override
	protected void initService() {
	}

	@Override
	protected void destroyService() {
	}

	@Override
	public PosHwRS232 getSerialPort(int inPort) {
		return null;
	}

	@Override
	public int getSerialPortCount() {
		return 0;
	}

	@Override
	public PosHwScale getScale() {
		return null;
	}

	@Override
	public synchronized PosHwPrinter getPrinter() {
		if ( printer == null && !printerFail ) {
			printer = BTPrinterInterface.create(this);
			printerFail = (printer == null); 
		}
		return printer;
	}

	@Override
	public PosHwDisplay getCustomerDisplay() {
		return null;
	}

	@Override
	public boolean openCashDrawer() throws IOException {
		return false;
	}
	
	public synchronized void close() {
		if ( printer != null ) {
			printer.close();
			printer = null;
		}		
	};

}
