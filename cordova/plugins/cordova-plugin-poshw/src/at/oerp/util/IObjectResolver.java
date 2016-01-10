package at.oerp.util;

public interface IObjectResolver {
	
	public final static IObjectResolver EMPTY = new IObjectResolver() {
		@Override
		public Object get(String inId) {
			return null;
		}
	};
	
	/**
	 * @param inId Id to get
	 * @return the resolved object or null
	 */
	public Object get(String inId);
}
