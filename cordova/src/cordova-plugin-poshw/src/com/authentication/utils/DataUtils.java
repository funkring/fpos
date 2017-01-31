package com.authentication.utils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import android.text.TextUtils;
import android.util.Log;

public class DataUtils {
	private static String hexString = "0123456789ABCDEF";
	public static boolean isContactless = false;

	private char[] getChar(int position) {
		String str = String.valueOf(position);
		if (str.length() == 1) {
			str = "0" + str;
		}
		char[] c = { str.charAt(0), str.charAt(1) };
		return c;
	}

	public static byte[] getFirstCmd(byte[] buffer, int len) {
		Log.i("cy", "Enter function DataUtils-getFirstCmd()");
		int lrc = DataUtils.iso7816CalcLRC(buffer, len);
		byte[] cmd = new byte[len + 1];
		System.arraycopy(buffer, 0, cmd, 0, len);
		cmd[len] = (byte) lrc;
		String toLogStr = DataUtils.toHexString(cmd);
		Log.i("cy", "To get first cmd " + toLogStr);
		return cmd;
	}

	public static short iso7816CalcLRC(byte[] buffer, int len) {
		Log.i("cy", "Enter function DataUtils-iso7816CalcLRC()");
		int lenBuf = buffer.length;
		if (0 == lenBuf || null == buffer) {
			return -1;
		}
		short lrc = 0;
		for (int i = 0; i < len; i++) {
			lrc ^= buffer[i];
			lrc &= 0xFF;
		}
		return lrc;
	}

	/**
	 * @param hex
	 * @return
	 */
	public static byte[] hexStringTobyte(String hex) {
		if (TextUtils.isEmpty(hex)) {
			return null;
		}
		hex = hex.toUpperCase();
		int len = hex.length() / 2;
		byte[] result = new byte[len];
		char[] achar = hex.toCharArray();
		String temp = "";
		for (int i = 0; i < len; i++) {
			int pos = i * 2;
			result[i] = (byte) (toByte(achar[pos]) << 4 | toByte(achar[pos + 1]));
			temp += result[i] + ",";
		}
		return result;
	}

	public static int toByte(char c) {
		byte b = (byte) "0123456789ABCDEF".indexOf(c);
		return b;
	}

	/**
	 * 
	 * @param b
	 * @return
	 */
	public static String toHexString(byte[] b) {
		StringBuffer buffer = new StringBuffer();
		for (int i = 0; i < b.length; i++) {
			buffer.append(toHexString1(b[i]));
		}
		return buffer.toString();
	}

	public static String toHexString1(byte b) {
		String s = Integer.toHexString(b & 0xFF);
		if (s.length() == 1) {
			return "0" + s;
		} else {
			return s;
		}
	}

	public static String toString(byte[] b) {
		StringBuffer buffer = new StringBuffer();
		for (int i = 0; i < b.length; i++) {
			buffer.append(toString1(b[i]));
		}
		return buffer.toString();
	}

	public static String toString1(byte b) {
		String s = Integer.toString(b & 0xFF);
		if (s.length() == 1) {
			return "0" + s;
		} else {
			return s;
		}
	}

	/**
	 */
	public static String hexStr2Str(String hexStr) {
		String str = "0123456789ABCDEF";
		char[] hexs = hexStr.toCharArray();
		byte[] bytes = new byte[hexStr.length() / 2];
		int n;
		for (int i = 0; i < bytes.length; i++) {
			n = str.indexOf(hexs[2 * i]) * 16;
			n += str.indexOf(hexs[2 * i + 1]);
			bytes[i] = (byte) (n & 0xff);
		}
		return new String(bytes);
	}

	/**
	 */
	public static String str2Hexstr(String str) {
		try {
			byte[] bytes = str.getBytes("GBK"); 
			StringBuilder sb = new StringBuilder(bytes.length * 2); 
			for (int i = 0; i < bytes.length; i++) {
				sb.append(hexString.charAt((bytes[i] & 0xf0) >> 4));
				sb.append(hexString.charAt((bytes[i] & 0x0f) >> 0) + " ");
			}
			Log.i("xuws", "test " + sb.toString().replace(" ", ""));
			return sb.toString().replace(" ", "");
		} catch (Exception e) {
			return "";
		}
	}

	public static String byte2Hexstr(byte b) {
		String temp = Integer.toHexString(0xFF & b);
		if (temp.length() < 2) {
			temp = "0" + temp;
		}
		temp = temp.toUpperCase();
		return temp;
	}

	public static String str2Hexstr(String str, int size) {
		byte[] byteStr = str.getBytes();
		byte[] temp = new byte[size];
		System.arraycopy(byteStr, 0, temp, 0, byteStr.length);
		temp[size - 1] = (byte) byteStr.length;
		String hexStr = toHexString(temp);
		return hexStr;
	}

	public static byte[] str2HexByte(String str, int size) {
		byte[] byteStr = str.getBytes();
		byte[] temp = new byte[size];
		System.arraycopy(byteStr, 0, temp, 0, byteStr.length);
		return temp;
	}

	/**
	 * 
	 * @param str
	 * @return
	 */
	public static String[] hexStr2StrArray(String str) {
		int len = 32;
		int size = str.length() % len == 0 ? str.length() / len : str.length()
				/ len + 1;
		String[] strs = new String[size];
		for (int i = 0; i < size; i++) {
			if (i == size - 1) {
				String temp = str.substring(i * len);
				for (int j = 0; j < len - temp.length(); j++) {
					temp = temp + "0";
				}
				strs[i] = temp;
			} else {
				strs[i] = str.substring(i * len, (i + 1) * len);
			}
		}
		return strs;
	}

	/**
	 * 
	 * @param hexstr
	 * @return
	 * @throws IOException
	 */
	public static byte[] compress(byte[] data) throws IOException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		GZIPOutputStream gzip = new GZIPOutputStream(out);
		gzip.write(data);
		gzip.close();
		return out.toByteArray();
	}

	/**
	 * 
	 * @param hexstr
	 * @return
	 * @throws IOException
	 */
	public static byte[] uncompress(byte[] data) throws IOException {

		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ByteArrayInputStream in = new ByteArrayInputStream(data);
		GZIPInputStream gunzip = new GZIPInputStream(in);
		byte[] buffer = new byte[256];
		int n;
		while ((n = gunzip.read(buffer)) >= 0) {
			out.write(buffer, 0, n);
		}
		return out.toByteArray();
	}

	public static byte[] short2byte(short s) {
		byte[] size = new byte[2];
		size[0] = (byte) (s >>> 8);
		short temp = (short) (s << 8);
		size[1] = (byte) (temp >>> 8);

		// size[0] = (byte) ((s >> 8) & 0xff);
		// size[1] = (byte) (s & 0x00ff);
		return size;
	}

	public static short[] hexStr2short(String hexStr) {
		byte[] data = hexStringTobyte(hexStr);
		short[] size = new short[4];
		for (int i = 0; i < size.length; i++) {
			size[i] = getShort(data[i * 2], data[i * 2 + 1]);
		}
		return size;
	}

	public static short getShort(byte b1, byte b2) {
		short temp = 0;
		temp |= (b1 & 0xff);
		temp <<= 8;
		temp |= (b2 & 0xff);
		return temp;
	}

	public static int getInt(byte[] data) {
		int temp = 0;
		if (data == null) {
			return 0;
		}
		int length = data.length;
		for (int i = 0; i < length; i++) {
			temp |= (data[i] & 0xff);
			if (i != length - 1) {
				temp <<= 8;
			}
		}
		return temp;
	}

	/**
	 */
	public static String BinaryToHexString(String s) {
		return Long.toHexString(Long.parseLong(s,2));
	}
}
