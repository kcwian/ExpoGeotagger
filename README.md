## Expo Geotagger App

### Raspberry Pi
- change metro cache folder to prevent rebuilding each time:
  
  ```export TMPDIR=your_cache_folder```

- optinally add **/etc/tmpfiles.d/tmp.conf** to prevent clearing **/tmp** folder:
```console 
# Override cleaning of /tmp in vendor /usr/lib/tmpfiles.d/tmp.conf,
# as documented in tmpfiles.d(5), for Kubuntu 15.04 and above that
# use systemd.  First char is 'd', instead of 'D', to avoid cleaning.

d /tmp 1777 root root -
```

## Upgrade SDK
- Update expo-cli: ```yarn global add expo-cli``` 
- Upgrade SDK: ```expo-cli upgrade``` 

## In case of upgrade problems:
- Update node: ```n lts```
- Clear yarn.lock: ```rm yarn.lock```
- Clear .expo: ```rm .expo```
- Upgrade: ```expo upgrade```

##  Local address instead of IP
- Add somehow ```export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.x``` 