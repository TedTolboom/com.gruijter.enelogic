# Enelogic and YouLess#

Homey app to integrate Enelogic P1 and YouLess LS110/LS120 energy meters.
A direct connection over IP is used, so there is no dependency on the Enelogic
cloud service.

![image][energy-mobile-card-image]

### Analogue Energy meter ###
The LS110/LS120 driver provides logs and flow cards for the following data:
- Actual power usage/production (W, 10s interval)
- Totalized power meter (kWh, 10s updates)

### S0 Energy meter ###
The LS120 S0 driver provides logs and flow cards for the following data:
- Actual power usage/production (W, 10s interval)
- Totalized power meter (kWh, 10s updates)

### P1 Energy and Gas meter ###
With the P1 connection on the LS120 or Enelogic you get the following extra's:
- All individual power meters (kWh, 10s updates)
- Recent gas usage (m3, of the previous hour)
- Gas meter (m3, 1 hour updates)
- Tariff change (off-peak, true or false)

**Ledring screensaver:**
- See how much energy you are using or producing just by looking at your Homey!
- Is the wash-dryer ready? Am I now producing power to the grid?

![image][energy-insights-image]

The power is totalized for consumed and produced power, during off-peak and
peak hours. Production to the powergrid is displayed as negative watts.
Only changed values are logged.

### S0 Water meter ###
The LS120 S0 driver can be used with a pulse water meter. It provides logs and
flow cards for the following data:
- Actual water flow (L/min)
- Water meter (m3)

### Experimental Optical Watermeter ###
<img src="https://forum.athom.com/uploads/editor/wb/kkyxklvl0jqc.jpg" alt="water meter" width="300"/>

This experimental driver makes use of the optical sensor of the YouLess LS110
and LS120. It has successfully been tested on water meters from Vitens ([type 1]).
Place the optical sensor on the rotating mirror. Exact positioning is required.
See the detailed [installation manual] for further instructions.

![image][water-insights-image]

The water meter driver provides logs and flow cards for the following data:
- Actual water flow (L/min, 60s average)
- Water meter (m3)

![image][water-mobile-card-image]

The water meter driver can be installed additionally to the power meter driver.
If you use the LS120 with P1 connection, you will get all electricity meters, the
gas meter and the water meter simultaneously from one YouLess device!
The water meter driver uses the raw reflectiveness of the optical sensor. It has
to poll the YouLess 3x per second, which puts significant load on your Homey and
your WiFi network, especially when water is being used (burst mode is then
switched on). I'm working with YouLess to get them to support water meters in
the firmware so that it takes off the load from Homey and the network, and also
increases accuracy of the meter. But this has no priority with them since they
believe there aren't enough users interested in water meter functionality.
**If you like the water meter, please help me convince YouLess by placing a
comment below or in the [forum].**

### Device setup in Homey ###
![image][devices-image]

To setup, go to "Devices" and choose the correct driver. Use the LS120-P1 if you
have a P1 connection to your smart meter. Otherwise choose the LS110/120-E driver
Enter the fixed IP-address (preferred) or use the default url 'youless'.
If you want to use the S0 and/or the water meter, you can simply add these as an
additional device.


### Donate: ###
If you like the app you can show your appreciation by posting it in the [forum].
If you really like the app you can buy me a beer.

[![Paypal donate][pp-donate-image]][pp-donate-link]


===============================================================================

Version changelog: [changelog.txt]

[type 1]: https://www.vitens.nl/service/watermeter
[forum]: https://community.athom.com/t/4235
[installation manual]: https://forum.athom.com/discussion/comment/61126/#Comment_61126
[pp-donate-link]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FV7VNCQ6XBY6L
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif
[energy-mobile-card-image]: https://discourse-cdn-sjc1.com/business4/uploads/athom/original/2X/d/d5f2a59c7e2409eee3dabc9888babfa8ed89885a.png
[energy-insights-image]: https://discourse-cdn-sjc1.com/business4/uploads/athom/original/2X/a/a597c81dca654477d71888f644c5f8e8d35fe646.png
[water-mobile-card-image]: https://discourse-cdn-sjc1.com/business4/uploads/athom/original/2X/b/bf55a4ea7d276e559436363ef6e0797528f90814.png
[water-insights-image]: https://discourse-cdn-sjc1.com/business4/uploads/athom/original/2X/5/53ff080e7e55cdc13911a761c384683fd6612b46.png
[water-meter-image]: https://forum.athom.com/uploads/editor/wb/kkyxklvl0jqc.jpg
[devices-image]: https://discourse-cdn-sjc1.com/business4/uploads/athom/original/2X/9/96b25cb89bb25b68d54366e748e708fffc82db15.png
[changelog.txt]: https://github.com/gruijter/com.gruijter.enelogic/blob/master/changelog.txt
