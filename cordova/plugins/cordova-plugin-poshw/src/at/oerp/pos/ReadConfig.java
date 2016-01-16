package at.oerp.pos;

/**
 * read config
 * @author funkring
 *
 */
public final class ReadConfig {
	public final int timeout;
	public final int retries;
	public ReadConfig(int inTimeout, int inRetries) {
		timeout = inTimeout;
		retries = inRetries;
	}
}
