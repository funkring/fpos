package at.oerp.util;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import android.app.Application;

public class FileUtil {

	public static void copyFile(InputStream in, OutputStream out) throws IOException {
	    byte[] buffer = new byte[1024];
	    int read;
	    while((read = in.read(buffer)) != -1){
	      out.write(buffer, 0, read);
	    }
	}
	
	public static File extractAssetFile(Application app, String inName, String inDest, boolean override) throws IOException {		
		File dir = app.getCacheDir();
		if ( inDest != null ) {
			dir = new File(inDest);
		}
		File f = new File(dir, new File(inName).getName());
		if ( override || !f.exists() ) {
			InputStream in = app.getAssets().open(inName);
			try {
				FileOutputStream out = new FileOutputStream(f);
				try {
					copyFile(in, out);
					return f;
				} finally {
					out.close();
				}
			} finally {
				in.close();
			}
		}
		return f;
	}
}
