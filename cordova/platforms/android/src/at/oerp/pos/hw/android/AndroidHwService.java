package at.oerp.pos.hw.android;

import java.io.IOException;

import android.app.Application;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwRS232;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.PosHwService;

public class AndroidHwService extends PosHwService {

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
	public PosHwPrinter getPrinter() {
		return null;
	}

	@Override
	public PosHwDisplay getCustomerDisplay() {
		return null;
	}

	@Override
	public boolean openCashDrawer() throws IOException {
		return false;
	}

}
