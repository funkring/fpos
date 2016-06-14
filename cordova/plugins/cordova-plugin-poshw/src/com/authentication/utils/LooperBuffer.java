package com.authentication.utils;

public interface LooperBuffer {
	void add(byte[] buffer);

	byte[] getFullPacket();
}