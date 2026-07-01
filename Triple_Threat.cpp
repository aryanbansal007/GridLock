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
    int n,x;
    cin>>n>>x;

    vector<int> ans(3*n, -1);
    int num_zeroes = 3*n-x;

    int i = 0;
    
        while(i<n && num_zeroes > 0){
            if(ans[i] == -1){
                ans[i] = 0;
                num_zeroes--;
            }
            if(ans[i+n] == -1 && num_zeroes > 0){
                ans[i+n] = 0;
                num_zeroes--;
            } 
            i++;
        }

        for(int i=0;i<3*n;i++){
            if(ans[i] == -1){
                if(num_zeroes > 0){
                    ans[i] = 0;
                }
                else ans[i] = 1;
            }
        }

        for(int i = 0; i < 3*n; ++i) cout<<ans[i];
        cout<<endl;
    
}
return 0;
}