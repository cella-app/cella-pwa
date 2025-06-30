import { paymentApi } from '@/shared/api/payment.api';
import { PaymentSetupIntent } from '@/shared/data/models/Payment';
import { userAlertStore } from '../alert/stores/alert.store';
import { SERVERIFY_ALERT } from '../alert/stores/alert.store';

export async function createSetupIntent() {
	const { addAlert } = userAlertStore.getState();
	try {
		const { client_secret: clientSecret } = (await paymentApi.getSetupIntent()) as PaymentSetupIntent;
		return clientSecret;
	} catch (error) {
		console.error(error)
		addAlert({
			severity: SERVERIFY_ALERT.ERROR,
			message: "Create setup intent error"
		})
	}
}

