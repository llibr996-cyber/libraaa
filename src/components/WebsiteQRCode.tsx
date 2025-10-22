import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const WebsiteQRCode: React.FC = () => {
  const url = 'https://muhimmathlibrary.netlify.app/';

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center text-center">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Access on Mobile</h3>
      <div className="mb-4">
        <QRCodeCanvas 
          value={url} 
          size={180} 
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"L"}
          includeMargin={true}
        />
      </div>
      <p className="text-gray-600 font-medium">Scan to open SSF Muhimmath Library</p>
    </div>
  );
};

export default WebsiteQRCode;
