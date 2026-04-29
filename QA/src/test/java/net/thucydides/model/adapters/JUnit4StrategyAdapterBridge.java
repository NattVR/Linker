package net.thucydides.model.adapters;

import net.thucydides.core.adapters.junit4.JUnit4Adapter;

/**
 * Bridge adapter for Serenity 4.2.16.
 * TestFramework scans this package for TestStrategyAdapter implementations,
 * while the JUnit4 adapter lives in serenity-junit under a different package.
 */
public class JUnit4StrategyAdapterBridge extends JUnit4Adapter {
}
