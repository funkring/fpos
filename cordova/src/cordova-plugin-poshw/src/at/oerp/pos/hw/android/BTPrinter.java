package at.oerp.pos.hw.android;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.Set;
import java.util.UUID;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Log;
import at.oerp.pos.PosHwService;

public class BTPrinter extends BasicPrinter {

	protected PosHwService service;	
	protected BluetoothDevice  dev;
	
	// socket
	protected BluetoothSocket socket;
	
	// debug tag
	private final static String TAG = "BTPrinter"; 
	// bluetooth default serial uuid
	private final static UUID BT_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
	
	
	public static BTPrinter create(PosHwService inService) {
		BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
		adapter.cancelDiscovery();
		BTPrinter foundPrinter = null;
		if ( adapter.isEnabled() ) {
			Set<BluetoothDevice> devices = adapter.getBondedDevices();
			for ( BluetoothDevice dev : devices ) {
				try {
					BTPrinter printer = null;
					if ( dev.getName().equalsIgnoreCase("RPP200-E") ) {
						printer = new BTPrinter().setup(inService, dev);
					} else if (  dev.getName().equalsIgnoreCase("RPP300-E") ) {
						printer = new BTPrinter80().setup(inService, dev);
					}  else if (  dev.getName().equalsIgnoreCase("Bluetooth Printer") ) {
						printer = new BTPrinter().setup(inService, dev);
					}
					
					// check if printer was found
					if ( printer != null ) {
						foundPrinter = printer;
						
						// try open printer
						foundPrinter.open();
						return foundPrinter;
					}
					
				} catch (IOException e) {
					Log.e(TAG, "Unable to init " + dev.getName());
				}
			}
			
		}	
		return foundPrinter;
	}
	
	public UUID getUUID() {
		return BT_UUID;
	}
	
	public BTPrinter() {
		ascii = Charset.forName("ascii");
	}
	
	protected synchronized BTPrinter setup(PosHwService inService, BluetoothDevice inDev) throws IOException {
		service = inService;
		dev = inDev;
		return this;
	}
	
	public synchronized void open() throws IOException {
		// close before open new
		close();
		
		socket = dev.createInsecureRfcommSocketToServiceRecord(getUUID());
		try {
			socket.connect();
			openCom(socket.getInputStream(), socket.getOutputStream());
		} catch ( IOException e ) {
			// close on error
			close();
			throw e;
		}
	}

	@Override
	public synchronized void close() {
		closeCom();		
		if ( socket != null ) {
			try {
				socket.close();
			} catch (IOException e) {
				Log.e(TAG, e.getMessage(),e);
			} finally {
				socket = null;
			}
		}		
	}

	@Override
	public boolean isOpen() {
		return socket != null;
	}

	@Override
	public String getName() {
		return dev.getName();
	}

}
