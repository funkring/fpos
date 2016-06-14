package at.oerp.pos.hw.cpos800;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;

import com.authentication.utils.DataUtils;
import com.authentication.utils.LooperBuffer;

import android.os.SystemClock;
import android.util.Log;
import android_serialport_api.SerialPort;

public class SerialPortManager {
	private byte[] buffer = new byte[1024];

	private static int BAUDRATE = 230400;

	public static boolean switchRFID = false;

	final byte[] UP = { '1' };
	final byte[] DOWN = { '0' };

	private static final String[] PATHS = { "/dev/ttyHS1", "/dev/ttyHSL0",
			"/dev/ttyHSL0", "/dev/ttyHSL0", "/dev/ttyHSL1", "/dev/ttyHSL1" };
	private static final String[] GPIO_DEVS = { "/sys/GPIO/GPIO13/value",
			"/sys/class/pwv_gpios/pwv-seccpu/enable",
			"/sys/class/pwv_gpios/as602-en/enable",
			"/sys/class/pwv_gpios/as602-en/enable",
			"/sys/class/cw_gpios/printer_en/enable",
			"/sys/class/iccard_gpio/iccard_en/enable" };
	private static final String[] VERSION = { "M802", "M806", "SIMT1200",
			"COREWISE_V0", "msm8610", "CPOS800" };
	/**
	 * �����豸·��
	 */
	private static String PATH = PATHS[0];
	private static String GPIO_DEV = GPIO_DEVS[0];
	static {
		for (int i = 0; i < VERSION.length; i++) {
			if (VERSION[i].equals(android.os.Build.MODEL)) {
				PATH = PATHS[i];
				GPIO_DEV = GPIO_DEVS[i];
				break;
			}
		}
	}

	private SerialPort mSerialPort = null;

	private boolean isOpen;

	private boolean firstOpen = false;

	private OutputStream mOutputStream;

	private InputStream mInputStream;

	private byte[] mBuffer = new byte[50 * 1024];

	private int mCurrentSize = 0;

	private ReadThread mReadThread;

	/**
	 * ��ȡ�����ʵ������Ϊ����
	 * 
	 * @return
	 */
	private volatile static SerialPortManager mSerialPortManager;

	private SerialPortManager() {
	}

	public static SerialPortManager getInstance() {
		if (mSerialPortManager == null) {
			synchronized (SerialPortManager.class) {
				if (mSerialPortManager == null) {
					mSerialPortManager = new SerialPortManager();
				}
			}
		}
		return mSerialPortManager;
	}

	public void setBaudrate(int baudrate) {
		BAUDRATE = baudrate;
	}

	/**
	 * �жϴ����Ƿ��
	 * 
	 * @return true���� false��δ��
	 */
	public boolean isOpen() {
		return isOpen;
	}

	/**
	 * �򿪴��ڣ������Ҫ��ȡ���֤��ָ����Ϣ�������ȴ򿪴��ڣ����ô˷���
	 */
	public boolean openSerialPort() {
		if (mSerialPort == null) {
			// �ϵ�
			try {
				setUpGpio();
				mSerialPort = new SerialPort(new File(PATH), 230400, 0);
			} catch (IOException e) {
				e.printStackTrace();
				return false;
			}

			mOutputStream = mSerialPort.getOutputStream();
			mInputStream = mSerialPort.getInputStream();
			mReadThread = new ReadThread();
			mReadThread.start();
			isOpen = true;
			firstOpen = true;
			return true;
		}
		return false;
	}

	/**
	 * �򿪴�ӡ������
	 */
	public boolean openSerialPortPrinter() {
		if (mSerialPort == null) {
			// �ϵ�
			try {
				setUpGpioPrinter();
				mSerialPort = new SerialPort(new File("/dev/ttyHSL0"), 230400,
						0);
			} catch (IOException e) {
				e.printStackTrace();
				return false;
			}

			mOutputStream = mSerialPort.getOutputStream();
			mInputStream = mSerialPort.getInputStream();
			mReadThread = new ReadThread();
			mReadThread.start();
			isOpen = true;
			firstOpen = true;
			return true;
		}
		return false;
	}

	private boolean openSerialPort2() {
		if (mSerialPort == null) {
			try {
				mSerialPort = new SerialPort(new File(PATH), BAUDRATE, 0);
			} catch (SecurityException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
			Log.i("whw", "mSerialPort=" + mSerialPort);
			mOutputStream = mSerialPort.getOutputStream();
			mInputStream = mSerialPort.getInputStream();
			mReadThread = new ReadThread();
			mReadThread.start();
			isOpen = true;
			firstOpen = true;
			return true;
		}
		return false;
	}

	public boolean openSerialPort3() {
		if (mSerialPort == null) {
			try {
				mSerialPort = new SerialPort(new File("/dev/ttyHSL2"), 115200,
						0);
			} catch (SecurityException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
			Log.i("whw", "mSerialPort=" + mSerialPort);
			mOutputStream = mSerialPort.getOutputStream();
			mInputStream = mSerialPort.getInputStream();
			mReadThread = new ReadThread();
			mReadThread.start();
			isOpen = true;
			firstOpen = true;
			return true;
		}
		return false;
	}

	/**
	 * �رմ��ڣ��������Ҫ��ȡָ�ƻ����֤��Ϣʱ���͹رմ���(���Խ�Լ��ص���)����������˳�ʱ�ر�
	 */
	public void closeSerialPort(int flag) {
		if (mReadThread != null)
			mReadThread.interrupt();
		mReadThread = null;
		try {
			switch (flag) {
			case 0:
				setDownGpio();
				setDownGpioPrinter();
				break;
			case 1:
				setDownGpio();
				break;
			case 2:
				setDownGpioPrinter();
				break;
			default:
				break;
			}

		} catch (IOException e1) {
			e1.printStackTrace();
		}
		if (mSerialPort != null) {
			try {
				mOutputStream.close();
				mInputStream.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
			mSerialPort.close();
			mSerialPort = null;
		}
		isOpen = false;
		firstOpen = false;
		mCurrentSize = 0;
		switchRFID = false;
		if (looperBuffer != null) {
			looperBuffer = null;
		}
	}

	private void closeSerialPort2() {
		if (mReadThread != null)
			mReadThread.interrupt();
		mReadThread = null;
		if (mSerialPort != null) {
			try {
				mOutputStream.close();
				mInputStream.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
			mSerialPort.close();
			mSerialPort = null;
		}
		isOpen = false;
		firstOpen = false;
		mCurrentSize = 0;
		switchRFID = false;
		if (looperBuffer != null) {
			looperBuffer = null;
		}
	}

	public synchronized int read(byte buffer[], int waittime, int interval) {
		if (!isOpen) {
			return 0;
		}
		int sleepTime = 5;
		int length = waittime / sleepTime;
		boolean shutDown = false;
		for (int i = 0; i < length; i++) {
			if (mCurrentSize == 0) {
				SystemClock.sleep(sleepTime);
				continue;
			} else {
				break;
			}
		}

		if (mCurrentSize > 0) {
			long lastTime = System.currentTimeMillis();
			long currentTime = 0;
			int lastRecSize = 0;
			int currentRecSize = 0;
			while (!shutDown && isOpen) {
				currentTime = System.currentTimeMillis();
				currentRecSize = mCurrentSize;
				if (currentRecSize > lastRecSize) {
					lastTime = currentTime;
					lastRecSize = currentRecSize;
				} else if (currentRecSize == lastRecSize
						&& currentTime - lastTime >= interval) {
					shutDown = true;
				}
			}
			if (mCurrentSize <= buffer.length) {
				System.arraycopy(mBuffer, 0, buffer, 0, mCurrentSize);
			}
		} else {
			SystemClock.sleep(100);
		}
		return mCurrentSize;
	}

	public synchronized int readFixedLength(byte buffer[], int waittime,
			int requestLength) {
		return readFixedLength(buffer, waittime, requestLength, 15);
	}

	public synchronized int readFixedLength(byte buffer[], int waittime,
			int requestLength, int interval) {
		if (!isOpen) {
			return 0;
		}
		int sleepTime = 5;
		int length = waittime / sleepTime;
		boolean shutDown = false;
		for (int i = 0; i < length; i++) {
			if (mCurrentSize == 0) {
				SystemClock.sleep(sleepTime);
				continue;
			} else {
				break;
			}
		}

		if (mCurrentSize > 0) {
			long lastTime = System.currentTimeMillis();
			long currentTime = 0;
			int lastRecSize = 0;
			int currentRecSize = 0;
			while (!shutDown && isOpen) {
				if (mCurrentSize == requestLength) {
					shutDown = true;
				} else {
					currentTime = System.currentTimeMillis();
					currentRecSize = mCurrentSize;
					if (currentRecSize > lastRecSize) {
						lastTime = currentTime;
						lastRecSize = currentRecSize;
					} else if (currentRecSize == lastRecSize
							&& currentTime - lastTime >= interval) {
						shutDown = true;
					}
				}
			}

			if (mCurrentSize <= buffer.length) {
				System.arraycopy(mBuffer, 0, buffer, 0, mCurrentSize);
			}
		} else {
			closeSerialPort2();
			SystemClock.sleep(100);
			openSerialPort2();
		}
		return mCurrentSize;
	}

	private LooperBuffer looperBuffer;

	public void setLoopBuffer(LooperBuffer looperBuffer) {
		this.looperBuffer = looperBuffer;
	}

	private void writeCommand(byte[] data) {
		if (!isOpen) {
			return;
		}
		if (firstOpen) {
			SystemClock.sleep(500);
			firstOpen = false;
		}
		mCurrentSize = 0;
		try {
			mOutputStream.write(data);
		} catch (IOException e) {
		}
	}

	protected synchronized void clearReceiveData() {
		mCurrentSize = 0;
	}

	public synchronized void write(byte[] data) {
		writeCommand(data);
	}

	public void setUpGpio() throws IOException {
		FileOutputStream fw = new FileOutputStream(GPIO_DEV);
		fw.write(UP);
		fw.close();
	}

	public void setDownGpio() throws IOException {
		FileOutputStream fw = new FileOutputStream(GPIO_DEV);
		fw.write(DOWN);
		fw.close();
	}

	public void setUpGpioPrinter() throws IOException {
		FileOutputStream fw = new FileOutputStream(
				"/sys/class/cw_gpios/printer_en/enable");
		fw.write(UP);
		fw.close();
	}

	public void setDownGpioPrinter() throws IOException {
		FileOutputStream fw = new FileOutputStream(
				"/sys/class/cw_gpios/printer_en/enable");
		fw.write(DOWN);
		fw.close();
	}

	public String getGpioStatus() throws IOException {
		String value;
		BufferedReader br = null;
		FileInputStream inStream = new FileInputStream(GPIO_DEV);
		br = new BufferedReader(new InputStreamReader(inStream));
		value = br.readLine();
		inStream.close();
		return value;
	}

	public synchronized void clearBuffer() {
		mCurrentSize = 0;
	}

	private class ReadThread extends Thread {
		@Override
		public void run() {
			byte[] buffer = new byte[5120000];
			while (!isInterrupted()) {
				int length = 0;
				try {
					if (mInputStream == null)
						return;
					length = mInputStream.read(buffer);
					if (length > 0) {
						if (looperBuffer != null) {
							byte[] buf = new byte[length];
							System.arraycopy(buffer, 0, buf, 0, length);
							looperBuffer.add(buf);
						} // else {
						System.arraycopy(buffer, 0, mBuffer, mCurrentSize,
								length);
						mCurrentSize += length;
						// }
					}
				} catch (IOException e) {
					e.printStackTrace();
					return;
				}
			}
		}
	}

	public boolean isUpGpio() {
		int length = SerialPortManager.getInstance().read(buffer, 3000, 100);
		if (2 > length) {
			return false;
		}

		byte[] recvData = new byte[length];

		System.arraycopy(buffer, 0, recvData, 0, length);
		DataUtils.toHexString(recvData);
		for (int i = 0; i < length - 1; i++) {
			if (recvData[i] == 50 && recvData[i + 1] == 80) {
				return true;
			}
		}
		return false;
	}
}