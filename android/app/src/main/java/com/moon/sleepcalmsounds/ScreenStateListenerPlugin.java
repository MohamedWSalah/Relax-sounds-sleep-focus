package com.moon.relaxsounds;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenStateListener")
public class ScreenStateListenerPlugin extends Plugin {

    private BroadcastReceiver screenStateReceiver;
    private boolean isReceiverRegistered = false;

    @Override
    public void load() {
        super.load();
        registerScreenStateReceiver();
    }

    private void registerScreenStateReceiver() {
        if (isReceiverRegistered) {
            android.util.Log.d("ScreenStateListener", "Receiver already registered");
            return;
        }

        android.util.Log.d("ScreenStateListener", "Registering broadcast receiver...");

        screenStateReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                android.util.Log.d("ScreenStateListener", "Broadcast received: " + action);
                
                if (action == null) {
                    return;
                }

                JSObject data = new JSObject();
                
                switch (action) {
                    case Intent.ACTION_SCREEN_ON:
                        android.util.Log.d("ScreenStateListener", "SCREEN_ON event");
                        data.put("state", "on");
                        notifyListeners("screenOn", data);
                        break;
                    case Intent.ACTION_SCREEN_OFF:
                        android.util.Log.d("ScreenStateListener", "SCREEN_OFF event");
                        data.put("state", "off");
                        notifyListeners("screenOff", data);
                        break;
                    case Intent.ACTION_USER_PRESENT:
                        android.util.Log.d("ScreenStateListener", "USER_PRESENT event");
                        data.put("state", "unlocked");
                        notifyListeners("userPresent", data);
                        break;
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_USER_PRESENT);

        getContext().registerReceiver(screenStateReceiver, filter);
        isReceiverRegistered = true;
        android.util.Log.d("ScreenStateListener", "Broadcast receiver registered successfully");
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        registerScreenStateReceiver();
        call.resolve();
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        unregisterScreenStateReceiver();
        call.resolve();
    }

    private void unregisterScreenStateReceiver() {
        if (isReceiverRegistered && screenStateReceiver != null) {
            try {
                getContext().unregisterReceiver(screenStateReceiver);
                isReceiverRegistered = false;
            } catch (Exception e) {
                // Receiver already unregistered
            }
        }
    }

    @Override
    protected void handleOnDestroy() {
        unregisterScreenStateReceiver();
        super.handleOnDestroy();
    }
}

