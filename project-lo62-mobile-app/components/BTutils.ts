const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

export const sendData = async (device, data) => {
    if (device) {
        try {
            const encodedData = Buffer.from(data).toString('base64');
            await device.writeCharacteristicWithResponseForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                encodedData
            );
            return 'Data sent successfully';
        } catch (error) {
            return 'Error sending data: '+error;
        }
    }
};

export const sendCommand = async (device, command) => {
    if (device) {
        try {
            const encodedCommand = Buffer.from([command]).toString('base64');
            await device.writeCharacteristicWithResponseForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                encodedCommand
            );
            console.log(`Command ${command} sent successfully`);
            return 'Command sent successfully';
        } catch (error) {
            console.error(`Error sending command ${command}:`, error);
            return 'Error sending command: '+error;
        }
    }
};