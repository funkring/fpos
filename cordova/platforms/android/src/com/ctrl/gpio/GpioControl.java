package com.ctrl.gpio;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

public class GpioControl
{
  public static final int finger = 0;
  public static final int led = 1;
  public static final int printer = 2;
  public static final String finger_o = "FINGBR_PWR_EN";
  public static final String led_o = "LED_CTL";
  public static final String printer_o = "PRINTER_CTL";
  public static final String sys_pwr = "SYS_PWR_EN";
  public static final String qx_o = "QX_CTL";
  public static final String printer_s = "PRINT_CTS";
  private static final String ctrl_gpio_path = "/dev/ctrl_gpio";

  public static final int get_status(String type)
  {
    FileInputStream mCalfdIn = null;
    String str = "10" + type;
    byte[] buff = str.getBytes();
    try {
      mCalfdIn = new FileInputStream(new File("/dev/ctrl_gpio"));
      mCalfdIn.read(buff);
      mCalfdIn.close();
      if (65 == buff[0])
        return 0;
      if (buff[0] > 65)
        return 1;
      return -1;
    } catch (IOException e) {
      e.printStackTrace(); }
    return -1;
  }

  public static final int convertLed()
  {
    int a = convertGPIO(1);
    return a;
  }

  public static final int activateLed() {
    int a = activate("LED_CTL", true);
    return a;
  }

  public static final int activatePrinter() {
    int a = activate("PRINTER_CTL", true);
    return a;
  }

  public static final int convertPrinter() {
    int a = convertGPIO(2);
    return a;
  }

  public static final int activate(String type, boolean open) {
    FileInputStream mCalfdIn = null;
    String str = gB(open) + type;
    byte[] buff = str.getBytes();
    try {
      mCalfdIn = new FileInputStream(new File("/dev/ctrl_gpio"));
      mCalfdIn.read(buff);
      mCalfdIn.close();
      return 0;
    } catch (IOException e) {
      e.printStackTrace(); }
    return -1;
  }

  public static int LED_CTL(boolean bPowerOnOff)
  {
    String ctrl_gpio_path = "/dev/ctrl_gpio";
    FileInputStream mCalfdIn = null;
    String str = "00LED_CTL ";
    byte[] buff = str.getBytes();
    buff[(buff.length - 1)] = 0;
    if (bPowerOnOff)
      buff[1] = 49;
    else
      buff[1] = 48;
    try {
      mCalfdIn = new FileInputStream(new File(ctrl_gpio_path));
      mCalfdIn.read(buff);
      mCalfdIn.close();
      return 0;
    } catch (IOException e) {
    }
    return -1;
  }

  public static int PRINGER_CTL(boolean bPowerOnOff)
  {
    String ctrl_gpio_path = "/dev/ctrl_gpio";
    FileInputStream mCalfdIn = null;
    String str = "00PRINTER_CTL ";
    byte[] buff = str.getBytes();
    buff[(buff.length - 1)] = 0;
    if (bPowerOnOff)
      buff[1] = 49;
    else
      buff[1] = 48;
    try {
      mCalfdIn = new FileInputStream(new File(ctrl_gpio_path));
      mCalfdIn.read(buff);
      mCalfdIn.close();
      return 0;
    } catch (IOException e) {
    }
    return -1;
  }

  private static final String gB(boolean open)
  {
    return ((open) ? "01" : "00");
  }

  public static final int convertGPIO(int sel) {
    FileInputStream mCalfdIn = null;
    String str_en = "00UART7_EN";
    String str_sel0 = "00UART7_SEL00";
    String str_sel1 = "00UART7_SEL10";
    byte[] buff_en = str_en.getBytes();
    byte[] buff_sel0 = str_sel0.getBytes();
    byte[] buff_sel1 = str_sel1.getBytes();
    if (sel == 0)
    {
      buff_sel0[1] = 48;
      buff_sel1[1] = 48;
    } else if (1 == sel)
    {
      buff_sel0[1] = 49;
      buff_sel1[1] = 48;
    } else if (2 == sel)
    {
      buff_sel0[1] = 48;
      buff_sel1[1] = 49;
    } else if (3 == sel)
    {
      buff_sel0[1] = 49;
      buff_sel1[1] = 49;
    }
    buff_sel0[(str_sel0.length() - 1)] = 0;
    buff_sel1[(str_sel1.length() - 1)] = 0;
    try {
      mCalfdIn = new FileInputStream(new File("/dev/ctrl_gpio"));
      mCalfdIn.read(buff_en);
      mCalfdIn.read(buff_sel0);
      mCalfdIn.read(buff_sel1);
      mCalfdIn.read(buff_en);
      mCalfdIn.close();
      return 0;
    } catch (IOException e) {
      e.printStackTrace(); }
    return -1;
  }
}