package at.oerp.pos.hw.android;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Log;
import at.oerp.pos.PosHwService;

public class BTPrinterInterface extends BasicPrinterInterface {
	
	// owner
	protected PosHwService service;
	
	// service
	protected BluetoothDevice  dev;
		
	// socket
	protected BluetoothSocket socket;
	protected InputStream	in;
	protected OutputStream  out;

		
	// debug tag
	private final static String TAG = "BTPrinterIface"; 

	// bluetooth default serial uuid
	private final static UUID BT_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
	
	public static BasicPrinter create(PosHwService inService) {
		BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
		adapter.cancelDiscovery();
		BasicPrinter foundPrinter = null;
		if ( adapter.isEnabled() ) {
			Set<BluetoothDevice> devices = adapter.getBondedDevices();
			for ( BluetoothDevice dev : devices ) {
				try {
					BasicPrinter printer = null;
					if ( Pattern.matches("^RP.*200.*$", dev.getName() ) ) {
						printer = new EscPrinter58(inService, new BTPrinterInterface(inService, dev));
					} else if ( Pattern.matches("^RP.*300.*$", dev.getName() ) ) {
						printer = new EscPrinter80(inService, new BTPrinterInterface(inService, dev));
					}  else if (  dev.getName().equalsIgnoreCase("Bluetooth Printer") ) {
						printer = new EscPrinter58(inService, new BTPrinterInterface(inService, dev));
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
		
	public BTPrinterInterface(PosHwService inService, BluetoothDevice inDev) throws IOException {
		service = inService;
		dev = inDev;
	}
		
		
	public void open() throws IOException {
		// close before open new
		close();
		
		socket = dev.createInsecureRfcommSocketToServiceRecord(getUUID());
		try {
			socket.connect();
			out = socket.getOutputStream();
			in = socket.getInputStream();
		} catch ( IOException e ) {
			// close on error
			close();
			throw e;
		}
	}

	@Override
	public void close() {
		if ( out != null ) {
			try {
				out.flush();
				out.close();
			} catch (IOException e ) {
				Log.e(TAG, e.getMessage(), e);
			} finally {
				out = null;
			}
		}
		if ( in != null ) {
			try {
				in.close();
			} catch (IOException e ) {
				Log.e(TAG, e.getMessage(),e);
			} finally {
				in = null;
			}
		}	
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

	@Override
	public void begin() throws IOException {
	}

	@Override
	public void end() throws IOException {
	}


	@Override
	public void write(byte[] inData) throws IOException {
		out.write(inData);
	}

	@Override
	public void write(byte[] inData, int inOffset, int inDataLen) throws IOException {
		out.write(inData, inOffset, inDataLen);		
	}

	@Override
	public void write(int inData) throws IOException {
		out.write(inData);
	}

	@Override
	public void flush() throws IOException {
		out.flush();
	}

	@Override
	public boolean readSupport() {
		return true;
	}

	@Override
	public int read() throws IOException {
		return in.read();
	}

	@Override
	public int getDefaultSleep() {
		return 60;
	}
}
