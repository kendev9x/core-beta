@echo off
setlocal EnableDelayedExpansion
set env[1].label=Develop
set env[1].value=dev
set env[2].label=Staging
set env[2].value=staging
set env[3].label=UAT
set env[3].value=uat
set env[4].label=Production
set env[4].value=prod

set service_cnt=0
for %%a in (.\bin\services_enable\*) do for %%F in (%%a) do (
	set /A service_cnt+=1
	set service[!service_cnt!]=%%~nF
)
set service_fsx=%service_cnt%

:step1
cls
echo =============
echo Please select an enviroments:
echo =============

FOR /L %%i IN (1 1 4) DO  (
   call echo %%i. %%env[%%i].label%%
)
set /p v_env=Type option:
set slEnv=!env[%v_env%].value!
goto step2

:step2
cls
echo =============
echo Please select a service:
echo =============
for /L %%i in (1,1,%service_fsx%) do echo %%i. !service[%%i]!

set /p v_service=Type option:
set slService=!service[%v_service%]!
set slService=%slService:.= % 
set /A cnt=0
for %%a in (%slService%) do (
	set ctx[!cnt!]=%%a
	set /A cnt+=1
)

set slType=%ctx[0]%
set slService=%ctx[1]%
goto step3

:step3 
cls
echo =============
set /p slInstance=Please type Instance Number [0-8]: 
echo =============
goto :step4

:step4
cls
echo =============
set /p port=Please type Port Number (press Enter to leave as default port): 
echo =============
if "%port%" equ "" goto :portNull
set /a BPort=%port%
setlocal ENABLEDELAYEDEXPANSION
set /a tempo=BPort
netstat -o -n -a | findstr :!tempo! 
if !ERRORLEVEL! equ 0 (@goto true) ELSE (@goto false)

:portNull
cls
echo We are working with env %slEnv%
echo We are working with type %slType%
echo We are working with service %slService%
echo We are working with %slInstance% instances 
if "%slType%"=="gw" npm run moleculer services/gw/apis/%slService%.%slType%.js -- --repl --hot --config configs/%slEnv%/%slType%.%slService%.config.js --envfile .run.env --instances %slInstance%
if "%slType%"=="biz" npm run moleculer bin/services_enable/%slType%.%slService%.service.js -- --repl --hot --config configs/%slEnv%/%slType%.%slService%.config.js --envfile .run.env --instances %slInstance%
:false
set slPort=!tempo!
cls
echo We are working with enviroment: %slEnv%
echo We are working with type: %slType%
echo We are working with service: %slService%
echo We are working with %slInstance% instances 
echo We are working on port: %slPort% 
if "%slType%"=="gw" set NODE_PORT=!tempo! && npm run moleculer services/gw/apis/%slService%.%slType%.js -- --repl --hot --config configs/%slEnv%/%slType%.%slService%.config.js --envfile .run.env --instances %slInstance%
if "%slType%"=="biz" set NODE_PORT=!tempo! && npm run moleculer bin/services_enable/%slType%.%slService%.service.js -- --repl --hot --config configs/%slEnv%/%slType%.%slService%.config.js --envfile .run.env --instances %slInstance%
pause
:true
echo Port !tempo! is used currently, please choose another port.
pause
cls
goto step4
:exit
@exit