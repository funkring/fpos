package hardware.print;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ShortBuffer;
import java.nio.charset.Charset;

import android.graphics.Bitmap;
import android.graphics.Bitmap.Config;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Paint.FontMetrics;
import android.graphics.Rect;
import android.util.Log;

public class printer {
	static String[] g_str = { "00", "01", "02", "03", "04", "05", "06", "07",
			"08", "09", "0A", "0B", "0C", "0D", "0E", "0F", "10", "11", "12",
			"13", "14", "15", "16", "17", "18", "19", "1A", "1B", "1C", "1D",
			"1E", "1F", "20", "21", "22", "23", "24", "25", "26", "27", "28",
			"29", "2A", "2B", "2C", "2D", "2E", "2F", "30", "31", "32", "33",
			"34", "35", "36", "37", "38", "39", "3A", "3B", "3C", "3D", "3E",
			"3F", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
			"4A", "4B", "4C", "4D", "4E", "4F", "50", "51", "52", "53", "54",
			"55", "56", "57", "58", "59", "5A", "5B", "5C", "5D", "5E", "5F",
			"60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6A",
			"6B", "6C", "6D", "6E", "6F", "70", "71", "72", "73", "74", "75",
			"76", "77", "78", "79", "7A", "7B", "7C", "7D", "7E", "7F", "80",
			"81", "82", "83", "84", "85", "86", "87", "88", "89", "8A", "8B",
			"8C", "8D", "8E", "8F", "90", "91", "92", "93", "94", "95", "96",
			"97", "98", "99", "9A", "9B", "9C", "9D", "9E", "9F", "A0", "A1",
			"A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "AA", "AB", "AC",
			"AD", "AE", "AF", "B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7",
			"B8", "B9", "BA", "BB", "BC", "BD", "BE", "BF", "C0", "C1", "C2",
			"C3", "C4", "C5", "C6", "C7", "C8", "C9", "CA", "CB", "CC", "CD",
			"CE", "CF", "D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8",
			"D9", "DA", "DB", "DC", "DD", "DE", "DF", "E0", "E1", "E2", "E3",
			"E4", "E5", "E6", "E7", "E8", "E9", "EA", "EB", "EC", "ED", "EE",
			"EF", "F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9",
			"FA", "FB", "FC", "FD", "FE", "FF" };
	public enum PrintType
	{
		Left,
		Centering,
		VerticalCentering,
		VerticalHorizontalCentering,
		TopCentering,
		LeftTop,
		RightTop,
		Right,
	};
	public enum ArrangeType
	{
		Left,
		Centering,		
		Right,
	};
	Bitmap m_bmpLine;
	String m_strPrint = "";
	int m_nMaxWidth = 384, m_nHeight = 24, m_nSpace = 0;
	// Boolean m_bUnline=false,m_bItalic=false,m_bBold=true;
	Paint m_pat = new Paint();
	Charset charset = Charset.forName("GB2312");
	
	public static byte[] Bitmap2Bytes(Bitmap bm) {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		bm.compress(Bitmap.CompressFormat.PNG, 100, baos);

		return baos.toByteArray();
	}

	public static Bitmap Bytes2Bimap(byte[] b) {
		if (b.length == 0) {
			return null;
		}

		return BitmapFactory.decodeByteArray(b, 0, b.length);
	}

	public byte[] BitmapToBytes(Bitmap bm) {
		if (bm == null) {
			byte[] bu = null;
			return bu;
		}
		// Log.v("hello","44444444444444444444444444444444444444444");
		int nlen = bm.getHeight() * bm.getWidth();
		// bm.getConfig();
		ByteBuffer dst = ByteBuffer.allocate(nlen * 4);
		bm.copyPixelsToBuffer(dst);
		dst.flip();
		// Log.v("hello","nlen="+nlen);
		byte[] buf = new byte[nlen * 2];
		dst.get(buf);
		return buf;
	}

	public short[] BitmapToShorts(Bitmap bm) {
		if (bm == null) {
			short[] bu = null;
			return bu;
		}
		int nlen = bm.getHeight() * bm.getWidth();
		// bm.getConfig();
		ShortBuffer dst = ShortBuffer.allocate(nlen * 2);
		bm.copyPixelsToBuffer(dst);
		dst.flip();
		// Log.v("hello","nlen="+nlen);
		short[] buf = new short[nlen];
		dst.get(buf);
		return buf;
	}

	public void PrintStringEx(String str, int nHeight, boolean bUnderline,
			boolean bBold,PrintType type) {
		String strPrint = m_strPrint + str;
		m_strPrint = "";

		// Paint pat=new Paint();
		m_pat.setTextSize(nHeight);
		m_pat.setFakeBoldText(bBold);
		m_pat.setUnderlineText(bUnderline);
		m_nHeight = nHeight;
		FontMetrics font = m_pat.getFontMetrics();
		int hi = (int) Math.ceil(font.descent - font.ascent);
		Bitmap bmp = Bitmap.createBitmap(m_nMaxWidth, hi, Config.ARGB_4444);
		if (bmp != null) {
			Canvas can = new Canvas(bmp);
			int[] index = new int[2];
			index[0] = 0;
			index[1] = 0;
			while (true) {
				if (GetOneString(m_pat, strPrint, index, nHeight)) {
					PrintOneString(can, m_pat,
							strPrint.substring(index[0], index[1]), hi, bmp,type);
				} else
					break;
			}
			can.setBitmap(null);
			bmp.recycle();
			bmp=null;
		}
		//return bmp;
	}
	public void PrintLineInit(int nHeight)
	{
		m_pat.setTextSize(nHeight);
		m_pat.setFakeBoldText(true);		
		FontMetrics font = m_pat.getFontMetrics();		
		int hi = (int) Math.ceil(font.descent - font.ascent);
		m_nHeight = nHeight;
		m_bmpLine = Bitmap.createBitmap(m_nMaxWidth, hi, Config.ARGB_4444);
		if(m_bmpLine!=null)
		{
			m_pat.setColor(Color.WHITE);
			Canvas can = new Canvas(m_bmpLine);
			can.drawRect(0, 0, m_nMaxWidth, hi, m_pat);
		}
	}
	void PrintLineOneString(String str,float nLeft, int nH, Bitmap bmp)
	{
		if (m_bmpLine != null) {
			m_pat.setColor(Color.BLACK);
			Canvas can = new Canvas(m_bmpLine);
			can.drawText(str, nLeft, nH, m_pat);	
		}
	}

	public void PrintLineString(String str, int nHeight, int nLeft,
			boolean bBold) {
		if (m_bmpLine != null) {
			m_pat.setTextSize(nHeight);
			m_pat.setFakeBoldText(bBold);
			FontMetrics font = m_pat.getFontMetrics();			
			int hi = (int) Math.ceil(font.descent - font.ascent);
			PrintLineOneString(str,nLeft,m_nHeight+(m_bmpLine.getHeight()-m_nHeight-hi+nHeight),m_bmpLine);
		}
	}

	public void PrintLineString(String str, int nHeight, PrintType type,
			boolean bBold) {
		if (m_bmpLine != null) {
			float nLeft=0;
			m_pat.setTextSize(nHeight);
			m_pat.setFakeBoldText(bBold);

			FontMetrics font = m_pat.getFontMetrics();
			int hi = (int) Math.ceil(font.descent - font.ascent);
			switch(type)
			{
			case Left:
				nLeft=0;
				hi=m_nHeight;
				break;
			case VerticalCentering:
				nLeft=0;
				hi=(m_nHeight-hi)/2+hi;
				break;
			case VerticalHorizontalCentering:
				nLeft=(m_nMaxWidth-m_pat.measureText(str))/2;
				hi=(m_nHeight-hi)/2+hi;
				break;
			case Centering:
				nLeft=(m_nMaxWidth-m_pat.measureText(str))/2;
				hi=m_nHeight;
				break;
			case Right:
				nLeft=m_nMaxWidth-m_pat.measureText(str);
				hi=m_nHeight;
				break;
			case TopCentering:
				nLeft=(m_nMaxWidth-m_pat.measureText(str))/2;
				hi=nHeight-(hi-nHeight);
				//hi=hi;				
				break;
			case LeftTop:
				nLeft=0;
				hi=nHeight-(hi-nHeight);
				break;
			case RightTop:
				nLeft=m_nMaxWidth-m_pat.measureText(str);
				hi=nHeight-(hi-nHeight);
				break;
			}			
			PrintLineOneString(str, nLeft, hi, m_bmpLine);
		}
	}
	public int PrintLineEnd()
	{
		int nret=IsError();
		if(nret!=0)
		{
			//Log.d("wpx", "out of paper");
			return nret;
		}
		
		if (m_bmpLine != null) {
			ShowLog(m_bmpLine);
			m_bmpLine.recycle();
			m_bmpLine=null;
		}

		return 0;
	}
	public Paint GetPaint() {
		return m_pat;
	}

	public int PrintString(String str) {
		int nret=IsError();
		if(nret!=0)
		{
			//Log.d("wpx", "out of paper");
			return nret;
		}
		String strPrint = m_strPrint + str;
		m_strPrint = "";
		// Paint pat=new Paint();
		// m_pat.setTextSize(nHeight);
		m_pat.setFakeBoldText(true);
		// m_nHeight=nHeight;
		FontMetrics font = m_pat.getFontMetrics();
		int hi = (int) Math.ceil(font.descent - font.ascent);
		Bitmap bmp = Bitmap.createBitmap(m_nMaxWidth, hi, Config.ARGB_4444);
		if (bmp != null) {
			Canvas can = new Canvas(bmp);
			int start = 0, end = 0;
			int[] index = new int[2];
			index[0] = 0;
			index[1] = 0;
			while (true) {
				if (GetOneString(m_pat, strPrint, index, hi)) {
					PrintOneString(can, m_pat,
							strPrint.substring(index[0], index[1]), hi, bmp,PrintType.Left);
				} else
					break;
			}
			can.setBitmap(null);
			bmp.recycle();
			bmp=null;
		}
		return 0;
	}

	public void PrintString(String str, int nHeight) {
		String strPrint = m_strPrint + str;
		m_strPrint = "";
		// Paint pat=new Paint();
		m_pat.setTextSize(nHeight);
		m_pat.setFakeBoldText(true);

		//int nnnnn = str.indexOf("\r"), nline = 0;
		m_nHeight = nHeight;
		FontMetrics font = m_pat.getFontMetrics();		
		int hi = (int) Math.ceil(font.descent - font.ascent);
		Bitmap bmp = Bitmap.createBitmap(m_nMaxWidth, hi, Config.ARGB_4444);
		if (bmp != null) {
			Canvas can = new Canvas(bmp);
			int start = 0, end = 0;
			int[] index = new int[2];
			index[0] = 0;
			index[1] = 0;
			while (true) {
				if (GetOneString(m_pat, strPrint, index, m_nHeight)) {
					PrintOneString(can, m_pat,
							strPrint.substring(index[0], index[1]), hi, bmp,PrintType.Left);
					//nline += hi;
				} else
					break;
			}
			can.setBitmap(null);
			bmp.recycle();
			bmp=null;
		}
		//Log.e("123", "line=" + nline);
		
		//return bmp;
	}

	Boolean GetOneString(Paint pat, String str, int[] index, int nH) {
		float width = 0;
		if (index[1] == 0) {
			width = pat.measureText(str);
			if ((width < m_nMaxWidth) && ((m_nMaxWidth - width) < nH)) {
				int nS = str.indexOf("\n", index[0]);
				if ((nS>=0)&&(nS < index[1])) 
				{
					index[0] = index[1];
					index[1] = nS+ 1;					
					return true;
				}
				m_strPrint += str;
				return false;
			}
		}
		index[0] = index[1];
		index[1] += m_nMaxWidth / nH;
		int nmax = str.length() - 1;
		if (index[1] > nmax) {
			index[1] = nmax;
		}
		if(index[1]<=index[0])
			return false;
		width = pat.measureText(str.substring(index[0], index[1]));
		while ((m_nMaxWidth - width) > nH) {
			index[1]++;
			if (index[1] > nmax) {
				int nS = str.indexOf("\n", index[0]);
				if ((nS>=0)&&(nS < index[1]))
				{
					index[1] = nS+ 1;
					return true;
				}
				m_strPrint += str.substring(index[0]);
				return false;
			}
			width = pat.measureText(str.substring(index[0], index[1]));
		}
		while ((width - m_nMaxWidth) > nH) {
			index[1]--;
			if (index[1] == index[0]) {
				index[1] = index[0] + 1;
				break;
				// return true;
			}
			width = pat.measureText(str.substring(index[0], index[1]));
		}
		int nS = str.indexOf("\n", index[0]);
		if ((nS>=0)&&(nS < index[1]))
		{
			index[1] = nS+ 1;
		}
		return true;
	}

	void PrintOneString(Canvas can, Paint pat, String str, int nH, Bitmap bmp,PrintType type) {
		pat.setColor(Color.WHITE);
		can.drawRect(new Rect(0, 0, m_nMaxWidth, nH), pat);
		float fw=pat.measureText(str);
		float fleft = 0;
		switch(type)
		{
		case Left:
			fleft=0;
			break;
		case VerticalHorizontalCentering:
		case Centering:
			fleft=(384-fw)/2;
			break;
		case Right:
			fleft=384-fw;
			break;
		}
		if (str.length() > 0) {
			pat.setColor(Color.BLACK);
			can.drawText(str, fleft, m_nHeight, pat);
		}
		ShowLog(bmp);
	}

	public void setLineSpacing(int nSpace) {
		m_nSpace = nSpace;
	}

	public int GetLineSpacing() {
		FontMetrics font = m_pat.getFontMetrics();
		return (int) Math.ceil(font.descent - font.ascent) - m_nHeight
				- m_nSpace;
	}

	public void Return(PrintType type) {
		String strPrint = m_strPrint;
		m_strPrint = "";
		// Paint pat=new Paint();
		m_pat.setTextSize(m_nHeight);

		FontMetrics font = m_pat.getFontMetrics();
		int hi = (int) Math.ceil(font.bottom - font.top);
		Bitmap bmp = Bitmap.createBitmap(m_nMaxWidth, hi, Config.ARGB_4444);
		if (bmp != null) {
			Canvas can = new Canvas(bmp);
			if (strPrint.length() == 0) {
				PrintOneString(can, m_pat, "", hi, bmp,type);
				return;
			}
			int start = 0, end = 0;
			int[] index = new int[2];
			index[0] = 0;
			index[1] = 0;
			while (true) {
				if (GetOneString(m_pat, strPrint, index, hi)) {
					PrintOneString(can, m_pat,
							strPrint.substring(index[0], index[1]), hi, bmp,type);
				} else {
					if (m_strPrint.length() > 0) {
						PrintOneString(can, m_pat, m_strPrint, hi, bmp,type);
						m_strPrint = "";
					}
					break;
				}
			}
		}
		//Log.v("print", "****************************************************");
	}

	void PrintLine(byte[] pdata, int noffset) {
		int i = 0, j = 0;
		// byte[] buf=new byte[490];
		// memset(buf,0,490);
		String str = "";
		for (j = 0; j < 48; j++) {
			for (i = 0; i < 8; i++) {
				str += (pdata[j + noffset] & (0x80 >> i)) == 0 ? " " : "*";
			}
		}
		Log.w("image", str);
	}

	void TestPrint(byte[] psend, int nline) {
		int i = 0, nStar = 8;
		for (i = 0; i < nline / 24; i++) {
			Log.w("head", BytesToString(psend, nStar - 8, 8));
			for (int j = 0; j < 24; j++)
				PrintLine(psend, nStar + j * 48);
			nStar += (8 + 48 * 24);
			Log.d("index", String.format("%02X", nStar));

		}
		for (i = 0; i < (nline % 24); i++) {
			PrintLine(psend, nStar + i * 48);
		}
	}

	public void ShowLog(Bitmap bm) {
		if (bm == null) {
			return;
		}
		int nlen = bm.getHeight() * bm.getWidth();
		// bm.getConfig();
		int nBit=bm.getByteCount()/nlen;
		if(nBit==2)
		{
			ShortBuffer dst = ShortBuffer.allocate(bm.getByteCount());
			bm.copyPixelsToBuffer(dst);
			dst.flip();
			short[] buf = new short[nlen];   
			dst.get(buf);
			
			int nwrite = PrintImage(buf);
		} 
		else   
		{
			ByteBuffer dst = ByteBuffer.allocate(bm.getByteCount());
			bm.copyPixelsToBuffer(dst);
			dst.flip();  
			byte[] buf = new byte[bm.getByteCount()];
			dst.get(buf);
		  
			int nwrite = PrintImageEx(buf,nBit);			
		}     
       
	}       
 
	public void PrintBitmap(final Bitmap bm) {

		int nheight = bm.getHeight() * 384 / bm.getWidth();
		Bitmap bmp = Bitmap.createBitmap(384, nheight, Config.ARGB_4444);
		Canvas can1 = new Canvas(bmp);
		Paint paint = new Paint();
		can1.drawBitmap(bm, new Rect(0, 0, bm.getWidth(), bm.getHeight()),
				new Rect(0, 0, 384, nheight), paint);
		ShowLog(bmp);
	}

	public boolean IsOutOfPaper() {
		byte[] buf = new byte[3];
		buf[1]=1;
		ReadData(buf);
		return buf[1] == 1;
	}

	public boolean IsOverTemperature() {
		byte[] buf = new byte[3];
		ReadData(buf);
		return buf[2] == 1;
	}
	int IsError()
	{
		byte[] buf = new byte[3];
		buf[1]=1;
		ReadData(buf);
		int nret=0;
		if(buf[1] == 1)
			nret|=1;
		if(buf[1] == 1)
			nret|=2;
		return nret;
	}
	public static String BytesToString(byte[] b) {
		String ret = " ";
		for (int i = 0; i < b.length; i++) {

			ret += g_str[(int) (b[i] & 0xFF)];
			ret += " ";
		}
		return ret.toUpperCase();
	}

	public static String BytesToString(byte[] b, int noffset, int ncount) {
		String ret = " ";
		for (int i = 0; i < ncount; i++) {

			ret += g_str[(int) (b[i + noffset] & 0xFF)];
			ret += " ";
		}
		return ret.toUpperCase();
	}
	public void PrintString24(String str)
	{
		PrintString24(str.getBytes(charset),0);
	}
	public void PrintString24Location(String str,int nleft)
	{
		PrintString24Location(str.getBytes(charset),nleft);
	}
	public void PrintString24Ex(String str,ArrangeType type)
	{
		int nArr=0;
		if(ArrangeType.Left==type)
		{
			nArr=0;
		}else if(ArrangeType.Centering==type)
		{
			nArr=1;
		}
		else
		{
			nArr=2;
		}
	
		PrintString24(str.getBytes(charset),nArr);
	}	
	static public native int Open();

	static public native int Close();

	static public native int Step(byte bStep);

	static public native int Unreeling(byte bStep);

	static public native void GoToNextPage();

	static public native int PrintImage(short[] data);
	
	static public native int PrintImageEx(byte[] data,int nBit);

	static public native int PrintString24(byte[] data,int nArr);
	
	static public native int PrintString24Location(byte[] data,int nLeft);

	static public native int IsReady();
	
	static public native int SetGrayLevel(byte blevel);

	static public native int ReadData(byte[] data);

	static public native int ReadDataEx(byte[] data, int noffset, int ncount);

	static { 
		System.loadLibrary("hardware-print");
	}

}
