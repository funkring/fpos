package at.oerp.pos.hw.st808;

import java.io.IOException;

import com.ctrl.gpio.Ioctl;

import at.oerp.pos.PosHwRS232;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.WeightResult;

public class ScaleServiceImpl extends PosHwScale{

	ST808Service service;
	
	public ScaleServiceImpl(ST808Service inService, PosHwRS232 inSerial) throws IOException {
		super(inSerial);
		service = inService;
	}
	
	@Override
	public boolean init(float inPrice, float inTara) throws IOException {
		synchronized ( service ) {
			Ioctl.convertDB9();
			return super.init(inPrice, inTara);
		}
	}
	
	@Override
	public synchronized boolean readResult(WeightResult ioResult) throws IOException {
		synchronized ( service ) {		
			return super.readResult(ioResult);
		}
	}
}
