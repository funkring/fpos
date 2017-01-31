/******************************************************************************
 * ped.h
 * 
 * Copyright (c) 2010 
 * 
 * DESCRIPTION: - 
 * 
 * Modification history
 * ----------------------------------------------------------------------------
 * Date         Version  Author       History
 * ----------------------------------------------------------------------------
 * 
 ******************************************************************************/

#ifndef _POS_EPP_H_
#define _POS_EPP_H_

#include <stdint.h>
#include <sys/types.h>


#ifndef BYTE
#define BYTE unsigned char
#endif

#ifndef WORD
#define WORD unsigned short
#endif

#ifndef DWORD
#define DWORD unsigned long
#endif

#ifndef uchar
#define uchar unsigned char
#endif



#undef NULL
#ifdef __cplusplus
#define		NULL		0
#else
#define		NULL		((void*)0)
#endif


#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */

#define KEY_TYPE_MASTER      0x01
#define KEY_TYPE_MAC         0x02
#define KEY_TYPE_PIN         0x03
#define KEY_TYPE_DUKPT_MAC   0x04
#define KEY_TYPE_DUKPT_PIN   0x05
#define KEY_TYPE_FIXED_MAC   0x10
#define KEY_TYPE_FIXED_PIN   0x11

#define EPPINFO_PRODUCT_NAME    0x00
#define EPPINFO_HW_VER          0x01
#define EPPINFO_HW_CFG          0x02
#define EPPINFO_EPP_SN          0x03
#define EPPINFO_CPU_ID          0x04
#define EPPINFO_BOOT_VER        0x10
#define EPPINFO_KERNEL_VER      0x11
#define EPPINFO_PROTOCOL_VER    0x20


enum EPP_ERROR_CODE
{
    EPP_SUCCESS = 0,
    EPP_RECV_PACKET_ERROR=2001,
    EPP_PORT_OPEN_ERROR,
    EPP_SEND_PACKET_ERROR,  // 3
    EPP_PACKET_LEN_ERROR,
    EPP_RECV_TIMEOUT,  // 5
    EPP_PACKET_LEN_TOO_LONG,
    EPP_CRC_CHECK_ERROR,  // 7
    EPP_OPEN_FILE_ERROR,
    EPP_SEEK_FILE_ERROR,  // 9
    EPP_WRITE_FILE_ERROR,
    EPP_READ_FILE_ERROR,  // 11
    EPP_CONFIGURE_INVALID,
    EPP_CONFIGURE_MAC_ERROR,  // 13
    EPP_NO_PIN,  // User not input PIN on N20
    EPP_SEND_CMD_ERROR,  // 15
    EPP_RECV_CMD_ERROR,
    EPP_RECV_RET_ERROR,  // 17
    EPP_RECV_LEN_ERROR,
    EPP_MAC_CHECK_ERROR,  // 19
    EPP_AUTHEN_FAILED,
    EPP_INPUT_PARAM_ERROR,  // 21
    EPP_USER_PRESS_CANCEL,  // User press key cancel on NEW7110
    EPP_INPUT_CMD_ERROR,  // 23
    EPP_INPUT_KEY_INDEX_ERROR,
    EPP_INPUT_MAC_LEN_ERROR, // 25
    EPP_INPUT_MODE_ERROR,
    EPP_KEY_TYPE_ERROR,  // 27
    EPP_KEY_INDEX_ERROR,
    EPP_MASTER_KEY_INDEX_ERROR,  // 29
    EPP_BMP_ERROR,
    EPP_PIN_CFG_LANGE_TYPE_ERROR,  // 31
    EPP_PIN_CFG_SYMBOL_TYPE_ERROR,
    EPP_INPUT_DATA_LEN_ERROR, // 33
    EPP_SET_PORT_ERROR,
    EPP_CFG_ERROR, // 35
    EPP_CLOSE_FAILED,
    EPP_KSN_LEN_ERROR,
    EPP_GET_PIN_CHK_ERROR,
    EPP_GET_MAC_CHK_ERROR,
    EPP_GET_DES_CHK_ERROR,
    EPP_CMP_PIN_CHK_ERROR,
    EPP_CMP_MAC_CHK_ERROR,
    EPP_CMP_DES_CHK_ERROR,
    EPP_INJECT_PIN_KEY_ERROR,
    EPP_INJECT_MAC_KEY_ERROR,
    EPP_INJECT_DES_KEY_ERROR,
};


enum N20_RETURN_CODE{
    RET_ERROR_BASE = 2300,
    RET_PASSWORD_ERROR,  // 1
    RET_BOOT_LEN_ERROR,
    RET_BOOT_HASH_ERROR, // 3
    RET_BOOT_MAC_ERROR,
    RET_NOT_UBSK,  // 5
    RET_CHECK_UBSK_FAILED,
    RET_CHECK_KSK_FAILED,  // 7
    RET_NOT_LCK,
    RET_NOT_AUTH,  // 9
    RET_NOT_LOGON,
    RET_RECV_FAILED,  // 11
    RET_AUTH_CHECK_FAILED,
    RET_MAC_CHECK_FAILED,  // 13
    RET_CRC_CHECK_ERROR,
    RET_KVC_CHECK_ERROR,  // 15
    RET_NOT_APP_FREE_SPACE,
    RET_APP_NOT_EXIST,  // 17
    RET_KEY_TYPE_ERROR,
    RET_KEY_TYPE_NOT_SUPPORT,  // 19
    RET_MAC_LEN_ERROR,
    RET_MAIN_KEY_INDEX_ERROR,  // 21
    RET_MAIN_KEY_NOT_EXIST,
    RET_KEY_INDEX_ERROR,  // 23
    RET_KEY_LEN_ERROR,
    RET_KEY_BE_USE,  // 25
    RET_MAIN_KEY_BE_USE,  // 26
    RET_MAC_ALG_MODE_ERROR,
    RET_KEY_GET_ERROR,
    RET_KEY_OVER_FLOW,  // 29
    RET_KEY_SAME_ERROR,
    RET_KEY_NOT_EXIST,  // 31
    RET_KEY_MAC_CHECK_FAILED,
    RET_KEY_KSN_LEN_ERROR,  // 33
    RET_KEY_BDK_LEN_ERROR,
    RET_USER_PRESS_CANCEL_EXIT,  // 35 User press key cancel on N20
    RET_USER_INPUT_TIME_OUT,  // N20 wait user input timeout
    RET_KSN_LEN_RERROR,  // 37 N20 check KSN length error
    RET_APP_NUM_OVER_FLOW,  // N20 found that application number over flow
    RET_RW_LENGTH_ERROR,  // 39
    RET_PIN_KEY_TIME_LOCK,  // N20 check PIN key use frequent and upto the limit, N20 will lock for a moment
    RET_MAC_KEY_TIME_LOCK,  // 41 N20 check MAC key use frequent and upto the limit, N20 will lock for a moment
    RET_SET_PIN_TIME_OUT_ERROR,
    RET_WRITE_EEPROM_FAILED,  // 43
    RET_RECV_LEN_ERROR,
    RET_PARAM_ERROR,  // 45
    RET_NO_INPUT_PIN
};



typedef struct {
    BYTE AppName[32];
    BYTE Lck[16];
    BYTE Mtek[24];
    BYTE Akdak[16];
    BYTE Akuak[16];
    BYTE Mdtek[24];
    BYTE Mutek[24];
} EppAuthKey_t;  // 152 bytes

typedef struct {
    BYTE  KeyType;  /*��Կ����
                            0x01������Կ��
                            0x02��MAC��Կ��
                            0x03��PIN��Կ��
                            0x10��Fixed MAC��Կ��
                            0x11��Fixed PIN��Կ��   */
    BYTE  Mode;/*
                         Bit0~3  TDEA_DECRYPT    0x00    ���ý��ܷ����õ�����Ŀ��Key
                                 TDEA_NONE       0x02    ֱ��д������Ŀ��Key(��MAC key��PIN key��Ч)
                         Bit4~7  PARITY_NONE     0x00    ��(���ܺ��)Key������У��
                                 PARITY_ODD      0x10    ��(���ܺ��)Key���Ľ�����У��
                                 PARITY_EVEN     0x20    ��(���ܺ��)Key���Ľ���żУ��*/
    BYTE  KeyLen;  // ��Կ���ȣ���ȡֵ8/16/24
    BYTE  KeyIndex;  // ��Կ����[1��100]
    BYTE  MasterKeyIndex; /*����Կ����[1��100]��ֻ����Կ������MAC��Կ����
                        PIN��Կ��ʱ�򣬸ò�������Ч*/
    BYTE  KeyData[24];  // ��Կ����
} EppAppKey_t;

typedef struct _EPP_CONFIGURE_ EPP_CFG;

/****************************************************************************
  ������     :  EPP_CONFIGURE *epp_open(const char *filename, int oflag, ...)
  ����       :  ��������̵��豸�ڣ�����NEW7110���豸��һ���ǡ�/dev/ttyS4��
                ���ߡ�/dev/ttyS4����������O_RDWR
  �������   :  1��const char *filename ����������豸��
               2��int oflag ���򿪵Ĳ�����O_RDWR
  �������   :  ��
  ����ֵ     :  ʧ���򷵻ؿ�ָ�룬�ɹ��򷵻ش򿪺�����þ��
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
EPP_CFG *epp_open(const char *filename, int oflag);

/****************************************************************************
  ������     :  int epp_close(EPP_CONFIGURE *cfg)
  ����       :  �ر���������豸���ͷ���Դ
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
  �������   :  ��
  ����ֵ     :  0 / EPP_CLOSE_FAILED
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_close(EPP_CFG *cfg);

/****************************************************************************
  ������     :  int epp_init(EPP_CONFIGURE *cfg, const EppAuthKey_t *eppkey)
  ����       :  �޸ĵ�ǰ��Կ���ã������ʹ��Ĭ�����ã�ÿ���豸������Ҫ��ʼ�����ã�
                ���ʹ��Ĭ�ϵ����ã���������ô˽ӿڡ�
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
               2��const EppAuthKey_t *eppkey ����ʼ��Կ��Ϣ
  �������   :  ��
  ����ֵ     :  0 / -1
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_init(EPP_CFG *cfg, const EppAuthKey_t *eppkey);

/****************************************************************************
  ������     :  int epp_download_lck_mtek(EPP_CONFIGURE *cfg)
  ����       :  ����ǰ�����е�LCK��MTEK���ص�N20��
                ���ʹ��Ĭ�ϵ����ã���������ô˽ӿڡ�
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
  �������   :  ��
  ����ֵ     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT / EPP_RECV_PACKET_ERROR
                 / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR / EPP_CRC_CHECK_ERROR
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_download_lck_mtek(EPP_CFG *cfg);

/****************************************************************************
  ������     :  int epp_download_aik(EPP_CONFIGURE *cfg)
  ����       :  ����ǰ�����е�AIK���ص�N20��
                ���ʹ��Ĭ�ϵ����ã���������ô˽ӿڡ�
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
  �������   :  ��
  ����ֵ     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_AUTHEN_FAILED
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_download_aik(EPP_CFG *cfg);

/****************************************************************************
  ������     :  int epp_download_appkey(EPP_CONFIGURE *cfg, const EppAppKey_t *appkey)
  ����       :  ����Ӧ����Կ
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
               2��const EppAppKey_t *appkey ��Ҫ���ص���Կ�ṹ
  �������   :  ��
  ����ֵ     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_AUTHEN_FAILED
                / EPP_KEY_TYPE_ERROR / EPP_MASTER_KEY_INDEX_ERROR / EPP_KEY_INDEX_ERROR
                / EPP_INPUT_DATA_LEN_ERROR / EPP_CFG_ERROR
  ��ע��������ص���Կ��Ҫ����Կ����ɢ����ô����Կ�ĳ��Ȳ��ܶ��ڱ���ɢ����Կ���ȡ�
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_download_appkey(EPP_CFG *cfg, const EppAppKey_t *appkey);

/****************************************************************************
  ������     :  int EppDownloadDukptKey(EPP_CFG *cfg, uint32_t KeyIndex,  const void *pBDK, const void *pKSN,
       uint32_t KSNLen)
  ����       :  Ӧ��DUKPT��Կ����
  �������   :  1��EPP_CFG *cfg ��EPP���þ��ָ��
                2��uint32_t KeyIndex ����Կ������ȡֵ��Χ[1,32]
                3��void *pBDK ��16�ֽ�BDK���룬δ����ɢ��BDK
                4��void *pKSN ��KSN����
                5��uint32_t KSNLen ��KSN����[1,10]
  �������   :  ��
  ����ֵ     :  EPP_SUCCESS/EPP_OPEN_FILE_ERROR/EPP_SEEK_FILE_ERROR/EPP_READ_FILE_ERROR/
                EPP_CONFIGURE_INVALID/EPP_CONFIGURE_MAC_ERROR/EPP_SEND_CMD_ERROR/
                EPP_RECV_CMD_ERROR/EPP_RECV_RET_ERROR/EPP_RECV_LEN_ERROR/EPP_AUTHEN_FAILED
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-06-08  V1.0         ����
****************************************************************************/
int epp_download_dukpt_key(EPP_CFG *cfg, uint32_t KeyIndex,  const void *pBDK, const void *pKSN,
       uint32_t KSNLen);

/****************************************************************************
  ������     :  int epp_get_rand(EPP_CONFIGURE *cfg, void *pRandBuf, size_t size)
  ����       :  ��ȡ�����
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��void *pRandBuf ���洢����������ݻ��壬8�ֽ�
                3��size_t size �������С
  �������   :  ��
  ����ֵ     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_INPUT_PARAM_ERROR
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_get_rand(EPP_CFG *cfg, void *pRandBuf, size_t size);

/****************************************************************************
  ������     :  int epp_get_mac(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex, 
                    uint32_t Mode, const void *pData, size_t DataLen, void *pMacOut)
  ����       :  ����MAC����
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��uint32_t KeyType ����Կ���͡�KEY_TYPE_MAC/KEY_TYPE_FIXED_MAC/KEY_TYPE_DUKPT
                3��uint32_t KeyIndex ��MAC��Կ�����������MAC����Fixed MAC��ȡֵ[1,100]��
                                     �����DUKPT MAC���ȡֵ[1,32]
                4��BYTE Mode �������㷨ѡ��
                                     0x00	�㷨1
                                     0x01	�㷨2
                                     0x02	EMV2000�㷨
                                     0x03	�й������㷨
                5��const void *pData �����������MAC����
                6��size_t DataLen ��MAC���ݳ��ȣ�������8������������СֵΪ8�����ֵΪ2024
  �������   :  1��void *pMacOut ��8�ֽ�MAC�������������������DUKPT_MAC_KEY����ǰ8���ֽ�
                   ��MAC����������10���ֽ��ǵ�ǰKSN��
  ����ֵ     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_INPUT_PARAM_ERROR 
                / EPP_INPUT_CMD_ERROR / EPP_INPUT_KEY_INDEX_ERROR / EPP_INPUT_MAC_LEN_ERROR
                / EPP_INPUT_MODE_ERROR / 
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_get_mac(EPP_CFG *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t Mode,
				const void *pData, size_t DataLen, void *pMacOut);

/****************************************************************************
  ������     :  int epp_get_pin(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t DisplayMode, 
				uint32_t Mode, const void *pCardInfo, const void *pLenInfo, void *pPinBlockOut)
  ����       :  PIN����API
  �������   :  1��EPP_CFG *cfg �����þ��ָ��
                2��uint32_t KeyType ����Կ���͡�KEY_TYPE_PIN/KEY_TYPE_FIXED_PIN/KEY_TYPE_DUKPT
                3��uint32_t KeyIndex ����Կ�����������PIN����Fixed PIN��ȡֵ[1,100]��
                                     �����DUKPT PIN���ȡֵ[1,32]
                4��uint32_t DisplayMode ��PIN��ʾģʽ��0��ʾ�����ң�1��ʾ���ҵ���2��ʾ���С�
                5��uint32_t Mode �������㷨ѡ��
                                        0x00��ʾѡ��Format 0ģʽ���㷨��
                                        0x01��ʾѡ��Format EMVģʽ���㷨��
                                        0x0a��ʾѡ��Format EPSģʽ���㷨��
                6��const void *pCardInfo ��16������Ϣ�����峤�ȱ��벻С��16�ֽ�
                7��const void *pLenInfo �����������PIN��Կ����ö��ֵ�ַ��������ȿ�ȡֵ0,4~12����
                            �����ַ�'0'��'4'��������'9'��'a'��'b'��'c'��ʾ��������������
                            "0456a\0\0\0\0\0\0\0\0"�����ʾ֧�ֳ���Ϊ0��4��5��6��10��PIN���롣
                            ���峤�Ȳ�С��13�ֽڡ�
  �������   :  1��void *pPinBlockOut �����峤����СΪ19�ֽڣ�ǰ8�ֽ���PIN���������ھŸ�
                   �ֽڱ�ʾ�û��Ƿ�����PIN�������0���ʾû����PIN��1��ʾ������PIN��
                   �����DUKPT���������9~18�ֽ��ǵ�ǰKSN
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_get_pin(EPP_CFG *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t DisplayMode,
				uint32_t Mode, const void *pCardInfo, const void *pLenInfo, void *pPinBlockOut);

/****************************************************************************
  ������     :  int epp_get_tdea(EPP_CONFIGURE *cfg, uint32_t Mode, uint32_t KeyType, uint32_t KeyIndex,
				 const void *pDataIn, size_t DataLen,  void *pDataOut)
  ����       :  TDEA����API
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��uint32_t Mode ���㷨ģʽ
                                0x0000: ECBģʽ��������
                                0x0001: ECBģʽ��������
                                0x0100: CBCģʽ��������
                                0x0101: CBCģʽ��������
                3��uint32_t KeyType ����Կ���͡�
                                0x01������Կ��
                                0x02��MAC��Կ��
                                0x03��PIN��Կ��
                                0x04��DUKPT MAC��Կ���ݲ�֧��
                                0x05��DUKPT PIN��Կ���ݲ�֧��
                                0x10��Fixed MAC��Կ��
                                0x11��Fixed PIN��Կ��  
                4��uint32_t KeyIndex ����Կ��������ȡֵ[1,100]
                5��const void *pDataIn ���������������
                6��size_t DataLen �����ݳ��ȣ�������8������������СֵΪ8�����ֵΪ96
  �������   :  1��void *pDataOut ��������
  ����ֵ     :  EPP_SUCCESS/EPP_SEND_CMD_ERROR/EPP_RECV_CMD_ERROR/EPP_RECV_RET_ERROR/
                EPP_RECV_LEN_ERROR/EPP_AUTHEN_FAILED/
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-11  V1.0         ����
****************************************************************************/
int epp_get_tdea(EPP_CFG *cfg, uint32_t Mode, uint32_t KeyType, uint32_t KeyIndex,
				 const void *pDataIn, size_t DataLen,  void *pDataOut);

/****************************************************************************
  ������     :  int epp_set_pin_input_timeout(EPP_CONFIGURE *cfg, ulong TimeoutMs)
  ����       :  ����PIN���볬ʱʱ�䳤�ȡ�
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��ulong TimeoutMs ����ʱʱ�䣬��λ��ms��
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_set_pin_input_timeout(EPP_CFG *cfg, unsigned long TimeoutMs);

/****************************************************************************
  ������     :  int epp_set_tdes_iv(EPP_CONFIGURE *cfg, const void *pIvData)
  ����       :  ����Tdes��ʼ������������ֻ��CBC�㷨��Ч
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��const void *pIvData ��8�ֽڵ�����������
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_set_tdes_iv(EPP_CFG *cfg, const void *pIvData);

/****************************************************************************
  ������     :  int EppClearAKey(BYTE KeyType, BYTE KeyIndex)
  ����       :  ���ĳ����Կ
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                1��BYTE KeyType ����Կ����
                                0x01������Կ��
                                0x02��MAC��Կ��
                                0x03��PIN��Կ��
                                0x10��Fixed MAC��Կ��
                                0x11��Fixed PIN��Կ��  
                2��BYTE KeyIndex ����Կ����
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-11  V1.0         ����
****************************************************************************/
int epp_clear_key(EPP_CFG *cfg, uint32_t KeyType, uint32_t KeyIndex);

/****************************************************************************
  ������     :  int epp_clear_appkey(EPP_CONFIGURE *cfg)
  ����       :  �����ǰӦ�õ�������Կ��
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_clear_appkey(EPP_CFG *cfg);

/****************************************************************************
  ������     :  int epp_format_ped(EPP_CONFIGURE *cfg)
  ����       :  ��ʼ������ʽ����������̣��ò�����ʹEPP���������Կ�����ָ�ʹ��Ĭ��ֵ��
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_format_ped(EPP_CFG *cfg);

/****************************************************************************
  ������     :  int epp_set_idle_logo(EPP_CONFIGURE *cfg, const void *pBmpIdleLogoIn)
  ����       :  ����IDLE LOGO��
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��void *pBmpIdleLogoIn  ����ɫBMP�ļ����������ݡ�
                               �����N20����ֱ��ʱ�����122*32��
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_set_idle_logo(EPP_CFG *cfg, const void *pBmpIdleLogoIn);

/****************************************************************************
  ������     :  int epp_resume_default_idle_logo(EPP_CONFIGURE *cfg)
  ����       :  �ظ�����Ĭ�ϵ�IDLE LOGO��
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_resume_default_idle_logo(EPP_CFG *cfg);

/****************************************************************************
  ������     :  int epp_display_logo(EPP_CFG *cfg, const void *pBmpLogoIn)
  ����       :  ��Һ��������ʾͼ����Ϣ
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��const void *pBmpLogoIn ����ɫBMPͼ�����Ϊ122x32
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_display_logo(EPP_CFG *cfg, uint32_t X, uint32_t Y, const void *pBmpLogoIn);

/****************************************************************************
  ������     :  int epp_display_string(EPP_CONFIGURE *cfg, int X, int Y, int iMode, const void *str, int iStrLen)
  ����       :  ����Ļ����ʾ�ַ�����Ŀǰn20ֻ����ʾASCII�ַ�
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��int X ����ʾλ��x
                3��int Y ����ʾλ��y
                4��int iMode ����ʾ�ַ��Ĵ�С8:6x8;16:8x16
                5��const void *str ����ʾ���ַ���
                6��int iStrLen ���ַ����ĳ���
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_display_string(EPP_CFG *cfg, uint32_t X, uint32_t Y, uint32_t iMode, 
                const void *str, uint32_t iStrLen);

/****************************************************************************
  ������     :  int epp_clear_screen(EPP_CONFIGURE *cfg)
  ����       :  �����Ļ��ʾ��
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_clear_screen(EPP_CFG *cfg);

int epp_enter_factory_test(EPP_CFG *cfg, BYTE bySpeed);

/****************************************************************************
  ������     :  int epp_get_system_info(EPP_CONFIGURE *cfg, uint32_t Type, void *pvInfoOut)
  ����       :  ��ȡEPP��Ϣ��
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��uint32_t Type ����ѯ���
                          0x00Ӳ���汾��
                          0x01Ӳ�����ã� 
                          0x02 �������кţ�
                          0x03 CPU SN��
                          0x10 boot�汾��
                          0x11 Kernel�汾��
                          0x20 ��ѯЭ��汾��
                
  �������   :  1��void *pvInfoOut ��������̷��ص����ݣ���������17���ֽڡ�
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_get_system_info(EPP_CFG *cfg, uint32_t Type, void *pvInfoOut);

/****************************************************************************
  ������     :  int epp_beep(EPP_CFG *cfg, uint32_t Frequency, uint32_t TimeMs)
  ����       :  ��Epp����������
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��DWORD dwFrequency ��
                        Ƶ�ʿ��Ʋ�����
                        (1)���ȡֵ��0��6�����ӦƵ����1680, 1834, 2020, 2127, 2380, 2700, 2900��
                        (2)���ȡֵ���ڵ���7���򰴸�ֵ������Ƶ�ʣ������ֵ��1500����Ƶ����1500��
                        ˵�����ò�������N20�����壬N20��֧�̶ֹ���2500hz��Ƶ�ʡ�
                3��DWORD dwTimeMs ������ʱ�䳤�ȣ���λ����
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_beep(EPP_CFG *cfg, uint32_t Frequency, uint32_t TimeMs);


/****************************************************************************
  ������     :  int epp_light(EPP_CONFIGURE *cfg, int TimeMs)
  ����       :  Epp�������
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��int TimeMs ��
                              <0:һֱ����
                              =0:һֱ��
                              >0:��ָ����ʱ����
                              �ò���ֻ����ģʽ1��ʱ�����Ч��   
  �������   :  ��
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-11  V1.0         ����
****************************************************************************/
int epp_light(EPP_CFG *cfg, int TimeMs); 


/****************************************************************************
  ������     :  int epp_kb_get_string(EPP_CONFIGURE *cfg, uint32_t iMode, uint32_t iMinLen, 
                   uint32_t iMaxlen, uint32_t iTimeOutMs, void *strBuff)
  ����       :  ��ȡ��������ϵ��û���������
  �������   :  1��EPP_CONFIGURE *cfg �����þ��ָ��
                2��uint32_t iMode ��ģʽ
                        D31 rev
                        ��  rev
                        D9  rev
                        D8  1��0�� �ǣ���������������뻻����ʾ
                        D7  1��0�� �ǣ���StrBufԤ��������Ч
                        D6  1��0�� ��С������
                        D5  1��0�� �ܣ���������
                        D4  1��0�� �ܣ������ַ�
                        D3  1��0�� �ǣ������뷽ʽ
                        D2  1��0�� ���ң���������
                        D1  1��0�� �У���С����
                        D0  1��0�� ����������ʾ
                3��uint32_t iMinLen ����С����
                4��uint32_t iMaxLen ����󳤶�
                5��uint32_t iTimeOutMs ����ʱʱ��
  �������   :  1��void *strBuff ��������̷��ص����ݣ���������󳤶Ⱦ�����
  ����ֵ     :  
  �޸���ʷ   :
      �޸���     �޸�ʱ��    �޸İ汾��   �޸�ԭ��
  1�� �ƿ���     2010-12-15  V1.0         ����
****************************************************************************/
int epp_kb_get_string(EPP_CFG *cfg, uint32_t iMode, uint32_t iMinLen, 
              uint32_t iMaxlen, uint32_t iTimeOutMs, void *strBuff);

int epp_unlock_ped(EPP_CFG *cfg, BYTE *pbyUnlockKey);

#ifdef __cplusplus
}
#endif /* __cplusplus */

#endif /* _POS_EPP_H_ */

