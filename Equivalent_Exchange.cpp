#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>
#include <stack>
#include <set>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <cstring>
#include <string>
#include <climits>
#include <iomanip>
#include <numeric>
#include <functional>
#include <deque>
#include <list>
#include <sstream>
#include <bitset>
#include <chrono>
using namespace std;


int  main(){
int t;
cin >> t;
while(t--){
    int n,k;
    cin>>n>>k;
    vector<int> vec(n);
    for(int i = 0; i < n; ++i) cin >> vec[i];

    int red;
    int blue;
    bool flag;

    for(int i=0; i<=k; i++){
        red = i;
        blue = k-i;
        flag = true;
        for(int j=0;j<n;j++){
            if(vec[j] > 0){
                red+=vec[j];
                blue-=vec[j];
            }
            else{
                red-=abs(vec[j]);
                blue+=abs(vec[j]);
            }
            if(red<0 || blue<0){
                flag = false;
                break;
            }
        }
        if(flag == true) break;
    }
    if(flag == false){
        cout<<"No"<<endl;
    }
    else{
        cout<<"Yes"<<endl;
    }
}
return 0;
}