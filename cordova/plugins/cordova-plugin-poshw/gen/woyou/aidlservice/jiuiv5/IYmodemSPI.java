/*
 * This file is auto-generated.  DO NOT MODIFY.
 * Original file: /home/oerp/Work/android/cordova-plugin-poshw/src/woyou/aidlservice/jiuiv5/IYmodemSPI.aidl
 */
package woyou.aidlservice.jiuiv5;
public interface IYmodemSPI extends android.os.IInterface
{
/** Local-side IPC implementation stub class. */
public static abstract class Stub extends android.os.Binder implements woyou.aidlservice.jiuiv5.IYmodemSPI
{
private static final java.lang.String DESCRIPTOR = "woyou.aidlservice.jiuiv5.IYmodemSPI";
/** Construct the stub at attach it to the interface. */
public Stub()
{
this.attachInterface(this, DESCRIPTOR);
}
/**
 * Cast an IBinder object into an woyou.aidlservice.jiuiv5.IYmodemSPI interface,
 * generating a proxy if needed.
 */
public static woyou.aidlservice.jiuiv5.IYmodemSPI asInterface(android.os.IBinder obj)
{
if ((obj==null)) {
return null;
}
android.os.IInterface iin = obj.queryLocalInterface(DESCRIPTOR);
if (((iin!=null)&&(iin instanceof woyou.aidlservice.jiuiv5.IYmodemSPI))) {
return ((woyou.aidlservice.jiuiv5.IYmodemSPI)iin);
}
return new woyou.aidlservice.jiuiv5.IYmodemSPI.Stub.Proxy(obj);
}
@Override public android.os.IBinder asBinder()
{
return this;
}
@Override public boolean onTransact(int code, android.os.Parcel data, android.os.Parcel reply, int flags) throws android.os.RemoteException
{
switch (code)
{
case INTERFACE_TRANSACTION:
{
reply.writeString(DESCRIPTOR);
return true;
}
case TRANSACTION_sendPercent:
{
data.enforceInterface(DESCRIPTOR);
float _arg0;
_arg0 = data.readFloat();
this.sendPercent(_arg0);
reply.writeNoException();
return true;
}
case TRANSACTION_sendFinish:
{
data.enforceInterface(DESCRIPTOR);
int _arg0;
_arg0 = data.readInt();
this.sendFinish(_arg0);
reply.writeNoException();
return true;
}
case TRANSACTION_onFinishYmodemDownload:
{
data.enforceInterface(DESCRIPTOR);
boolean _arg0;
_arg0 = (0!=data.readInt());
java.lang.String _arg1;
_arg1 = data.readString();
this.onFinishYmodemDownload(_arg0, _arg1);
reply.writeNoException();
return true;
}
}
return super.onTransact(code, data, reply, flags);
}
private static class Proxy implements woyou.aidlservice.jiuiv5.IYmodemSPI
{
private android.os.IBinder mRemote;
Proxy(android.os.IBinder remote)
{
mRemote = remote;
}
@Override public android.os.IBinder asBinder()
{
return mRemote;
}
public java.lang.String getInterfaceDescriptor()
{
return DESCRIPTOR;
}
/**
	 * 一个指令的发送进度
	 * @param percent 发送百分比
	 */
@Override public void sendPercent(float percent) throws android.os.RemoteException
{
android.os.Parcel _data = android.os.Parcel.obtain();
android.os.Parcel _reply = android.os.Parcel.obtain();
try {
_data.writeInterfaceToken(DESCRIPTOR);
_data.writeFloat(percent);
mRemote.transact(Stub.TRANSACTION_sendPercent, _data, _reply, 0);
_reply.readException();
}
finally {
_reply.recycle();
_data.recycle();
}
}
/**
	 * 一个指令发送完成
	 * @param count 发送的总包数
	 */
@Override public void sendFinish(int count) throws android.os.RemoteException
{
android.os.Parcel _data = android.os.Parcel.obtain();
android.os.Parcel _reply = android.os.Parcel.obtain();
try {
_data.writeInterfaceToken(DESCRIPTOR);
_data.writeInt(count);
mRemote.transact(Stub.TRANSACTION_sendFinish, _data, _reply, 0);
_reply.readException();
}
finally {
_reply.recycle();
_data.recycle();
}
}
/**
	 * ymodem 下载是否成功
	 * @param flag			是否成功
	 * @param msg			描述
	 */
@Override public void onFinishYmodemDownload(boolean flag, java.lang.String msg) throws android.os.RemoteException
{
android.os.Parcel _data = android.os.Parcel.obtain();
android.os.Parcel _reply = android.os.Parcel.obtain();
try {
_data.writeInterfaceToken(DESCRIPTOR);
_data.writeInt(((flag)?(1):(0)));
_data.writeString(msg);
mRemote.transact(Stub.TRANSACTION_onFinishYmodemDownload, _data, _reply, 0);
_reply.readException();
}
finally {
_reply.recycle();
_data.recycle();
}
}
}
static final int TRANSACTION_sendPercent = (android.os.IBinder.FIRST_CALL_TRANSACTION + 0);
static final int TRANSACTION_sendFinish = (android.os.IBinder.FIRST_CALL_TRANSACTION + 1);
static final int TRANSACTION_onFinishYmodemDownload = (android.os.IBinder.FIRST_CALL_TRANSACTION + 2);
}
/**
	 * 一个指令的发送进度
	 * @param percent 发送百分比
	 */
public void sendPercent(float percent) throws android.os.RemoteException;
/**
	 * 一个指令发送完成
	 * @param count 发送的总包数
	 */
public void sendFinish(int count) throws android.os.RemoteException;
/**
	 * ymodem 下载是否成功
	 * @param flag			是否成功
	 * @param msg			描述
	 */
public void onFinishYmodemDownload(boolean flag, java.lang.String msg) throws android.os.RemoteException;
}
