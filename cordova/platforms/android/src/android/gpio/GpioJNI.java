package android.gpio;

public class GpioJNI {
	static {
		try {
			System.loadLibrary("jni_gpio");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public static native void gpio_switch_gps_bluetooth(int paramInt);

	public static native int gpio_get_gps_bluetooth();

	public static native void gpio_switch_gps_power(int paramInt);

	public static native int gpio_get_gps_power();

	public static native void gpio_switch_rs485_rs232(int paramInt);

	public static native int gpio_get_rs485_rs232();

	public static native void gpio_switch_rs485_power(int paramInt);

	public static native int gpio_get_rs485_power();

	public static native void gpio_switch_rs232_power(int paramInt);

	public static native int gpio_get_rs232_power();

	public static native void gpio_switch_scan_rf_ired(int paramInt);

	public static native int gpio_get_scan_rf_ired();

	public static native void gpio_switch_rf_power(int paramInt);

	public static native int gpio_get_rf_power();

	public static native void gpio_switch_scan_power(int paramInt);

	public static native int gpio_get_scan_power();

	public static native void gpio_switch_scan_powerdown(int paramInt);

	public static native int gpio_get_scan_powerdown();

	public static native void gpio_switch_scan_trig(int paramInt);

	public static native int gpio_get_scan_trig();

	public static native void gpio_switch_scan_reset(int paramInt);

	public static native int gpio_get_scan_reset();

	public static native void gpio_switch_rf_reset(int paramInt);

	public static native int gpio_get_rf_reset();

	public static native void gpio_switch_ired(int paramInt);

	public static native int gpio_get_ired();
}