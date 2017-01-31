package com.ctrl.gpio;

import android.util.Log;
import java.io.PrintStream;

public class Ioctl
{
  static
  {
    try
    {
      System.loadLibrary("ctrl_gpio");
    } catch (UnsatisfiedLinkError ule) {
      System.err.println("WARNING: Could not load library!");
      Log.i("info", "error ===  " + ule.getMessage().toString());
    }
  }

  public static native int convertRfid();

  public static native int convertScanner();

  public static native int convertLed();

  public static native int convertMagcard();

  public static native int convertFinger();

  public static native int convertPrinter();

  public static native int convertIdReader();

  public static native int convertPSAM();

  public static native int convertDB9();

  public static native int convertRJ11();

  public static native int convertRS232_1();

  public static native int convertRS232_2();

  public static native int activate(int paramInt1, int paramInt2);

  public static native int get_status(int paramInt);
}