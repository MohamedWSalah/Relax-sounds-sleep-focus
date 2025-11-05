package com.moon.relaxsounds;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ScreenStateListenerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

