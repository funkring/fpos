package android.pt;

import android.util.Log;

public class Cprinter {
	
	
	public  native  int openPrinter();    
	public  native  int closePrinter();
	public  native  int getPrinterVersion(byte[] version);
	public  native  int setZoonIn(int widthZoonIn,int heightZoonIn);
	public  native  int setAlignType(int alignType);
	public  native  int setLeftMargin(int n);
	public  native  int setRightMargin(int n);
	public  native  int setLineSpacingByDotPitch (int n);
	public  native  int setWordSpacingByDotPitch(int n);
	public  native  int setPrintOrientation (int printOrientation);
	public  native  int setBold(int n);
	public  native  int setUnderLine(int n); 
	public  native  int setInverse(int n); 
	public  native  int printLF();
	public  native  int feedPaper(int n);
	public  native  int printEan8Code(byte[] bytes);
	public  native  int printEan13Code(byte[] bytes);
	public  native  int printUpca(byte[] bytes);
	public  native  int printUpce(byte[] bytes);
	public  native  int printImage(byte[] bytes);
	public  native  int printString(String content);   
	public  native  int printString(byte[] paramArrayOfByte, int paramInt);
	  
    static {  
    	 
		try { 
			  
			Log.i("edasion", "load cprinter lib");     
			System.loadLibrary("cprinter");       
			  
		} catch (Exception e) {      
			// TODO Auto-generated catch block      
			Log.e("edasion", "can not load cprinter lib");       
			e.printStackTrace();          
		}    
	}   
	
}
